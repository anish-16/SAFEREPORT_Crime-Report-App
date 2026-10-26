import { randomBytes } from 'crypto';
import { prisma } from '@/lib/server/prisma';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';
import { runAnalysis } from '@/lib/server/intelligence';
import {
  isAllowedUpload,
  isImageMime,
  isVideoMime,
  MAX_UPLOAD_BYTES,
  saveBuffer,
  saveThumb,
} from '@/lib/server/upload';
import { mergeAi, runAiAnalysis } from '@/lib/server/ai';

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
type Status = (typeof STATUS_FLOW)[number];

function genReportId(): string {
  return `SR-${randomBytes(4).toString('hex').toUpperCase()}`;
}

type MediaFile = { kind: 'image' | 'video'; buffer: Buffer; originalName: string; mime: string };

async function readMedia(form: FormData): Promise<MediaFile | null> {
  const file = form.get('media');
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('File too large (max 60 MB)');
  if (!isAllowedUpload(file.name, file.type)) {
    throw new Error('Unsupported file type. Use an image (jpg/png/webp/gif) or video (mp4/mov/webm).');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    kind: isVideoMime(file.type) ? 'video' : isImageMime(file.type) ? 'image' : 'image',
    buffer,
    originalName: file.name || 'upload',
    mime: file.type || 'application/octet-stream',
  };
}

/**
 * POST /api/reports — submit a report.
 * Works signed-in (user) or passwordless (X-Device-Id guest key); the local
 * engine always analyzes, and the configured AI provider refines it.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const session = getSession(req);
    if (!session.user && !session.deviceId) {
      return jsonError(401, 'Missing device identity — reload the page and try again');
    }

    const form = await req.formData();
    const title = String(form.get('title') ?? '');
    const description = String(form.get('description') ?? '');
    const type = String(form.get('type') ?? 'NON_EMERGENCY');
    const category = String(form.get('category') ?? '').trim();
    const location = String(form.get('location') ?? '').trim();
    const latitude = String(form.get('latitude') ?? '');
    const longitude = String(form.get('longitude') ?? '');

    if (!title || title.trim().length < 4) return jsonError(400, 'Title must be at least 4 characters');
    if (!description || description.trim().length < 15) {
      return jsonError(400, 'Description must be at least 15 characters');
    }

    const reportType = type === 'EMERGENCY' ? 'EMERGENCY' : ('NON_EMERGENCY' as const);

    // existing perceptual hashes → duplicate detection (last 500)
    const recent = await prisma.report.findMany({
      where: { mediaHash: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { reportId: true, mediaHash: true },
    });

    const media = await readMedia(form);

    const analysis = await runAnalysis({
      title: title.trim(),
      description: description.trim(),
      location: location || undefined,
      media: media ? { kind: media.kind, buffer: media.buffer, originalName: media.originalName } : null,
      existingHashes: recent
        .filter((r) => r.mediaHash)
        .map((r) => ({ reportId: r.reportId, hash: r.mediaHash as string })),
    });

    // Bring-your-own-key AI refinement (skipped silently when no key is set).
    const ai = await runAiAnalysis({
      title: title.trim(),
      description: description.trim(),
      location: location || undefined,
      category: category || undefined,
      media: media ? { kind: media.kind, mime: media.mime, buffer: media.buffer } : null,
      local: analysis,
    });
    if (ai.ok && ai.insight) mergeAi(analysis, ai.insight);
    else if (ai.error && ai.error !== 'skipped' && ai.error !== 'no-key') analysis.aiError = ai.error;

    let mediaUrl: string | undefined;
    let mediaType: string | undefined;
    let thumbUrl: string | undefined;

    if (media) {
      mediaType = media.kind === 'video' ? 'video' : 'image';
      mediaUrl = saveBuffer(
        media.buffer,
        `${Date.now()}-${media.originalName.replace(/[^\w.-]+/g, '_').slice(-60)}`
      );
      if (mediaType === 'image') {
        try {
          const Jimp = (await import('jimp')).default;
          const img = await Jimp.read(media.buffer);
          img.cover(320, 200).quality(70);
          thumbUrl = saveThumb(await img.getBufferAsync(Jimp.MIME_JPEG));
        } catch {
          // thumbnail is best-effort
        }
      }
    }

    const reportId = genReportId();
    // reporter's edit wins, else AI draft, else local engine classification
    const finalCategory =
      category ||
      (analysis.suggestions?.category && analysis.suggestions.category !== 'Uncategorized'
        ? analysis.suggestions.category
        : analysis.text.category !== 'Uncategorized'
          ? analysis.text.category
          : null);

    const report = await prisma.report.create({
      data: {
        reportId,
        userId: session.user?.id ?? null,
        deviceId: session.user ? session.deviceId : session.deviceId,
        type: reportType,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        location: location || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        mediaUrl,
        mediaType,
        thumbUrl,
        analysis: JSON.parse(JSON.stringify(analysis)),
        severity: analysis.text.severity,
        keywords: analysis.text.categoryScores.map((c) => c.label),
        mediaHash: analysis.image?.perceptualHash ?? null,
        status: analysis.triage.status as Status,
        events: {
          create: {
            to: analysis.triage.status as Status,
            note: `Auto-triage: ${analysis.triage.priority} priority (${Math.round(analysis.triage.confidence * 100)}% confidence)`,
            actorId: null,
          },
        },
      },
      include: { events: true },
    });

    return jsonOk({ report }, 201);
  } catch (err) {
    console.error('create report error', err);
    const message = err instanceof Error ? err.message : 'Failed to submit report';
    return jsonError(500, message);
  }
}

/** GET /api/reports — public platform stats. */
export async function GET(): Promise<Response> {
  const [total, byStatus, bySeverity] = await Promise.all([
    prisma.report.count(),
    prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.report.groupBy({ by: ['severity'], _count: { _all: true } }),
  ]);
  return jsonOk({
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    bySeverity: Object.fromEntries(
      bySeverity.filter((s) => s.severity !== null).map((s) => [s.severity as number, s._count._all])
    ),
  });
}
