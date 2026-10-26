import { runAnalysis } from '@/lib/server/intelligence';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';
import { isVideoMime, MAX_UPLOAD_BYTES } from '@/lib/server/upload';
import { mergeAi, runAiAnalysis } from '@/lib/server/ai';

/**
 * POST /api/reports/analyze — analysis preview without saving.
 * Local engine always; `?ai=1` also runs the configured AI provider
 * (used by the report form once the draft settles / on demand).
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const session = getSession(req);
    if (!session.user && !session.deviceId) {
      return jsonError(401, 'Missing device identity — reload the page and try again');
    }

    const url = new URL(req.url);
    const wantAi = url.searchParams.get('ai') === '1';

    const form = await req.formData();
    const title = String(form.get('title') ?? '');
    const description = String(form.get('description') ?? '');
    const location = String(form.get('location') ?? '');

    let media: { kind: 'image' | 'video'; buffer: Buffer; originalName: string; mime: string } | null = null;
    const file = form.get('media');
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_BYTES) return jsonError(400, 'File too large (max 60 MB)');
      media = {
        kind: isVideoMime(file.type) ? 'video' : 'image',
        buffer: Buffer.from(await file.arrayBuffer()),
        originalName: file.name || 'upload',
        mime: file.type || 'application/octet-stream',
      };
    }

    const analysis = await runAnalysis({
      title,
      description,
      location: location || undefined,
      media: media ? { kind: media.kind, buffer: media.buffer, originalName: media.originalName } : null,
    });

    if (wantAi) {
      const ai = await runAiAnalysis({
        title,
        description,
        location: location || undefined,
        category: String(form.get('category') ?? '').trim() || undefined,
        media: media ? { kind: media.kind, mime: media.mime, buffer: media.buffer } : null,
        local: analysis,
      });
      if (ai.ok && ai.insight) mergeAi(analysis, ai.insight);
      else if (ai.error && ai.error !== 'skipped' && ai.error !== 'no-key') analysis.aiError = ai.error;
    }

    return jsonOk({ analysis });
  } catch (err) {
    console.error('analyze error', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return jsonError(500, message);
  }
}
