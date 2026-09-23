import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { runAnalysis, hammingDistance } from '../intelligence';
import { upload, saveBuffer, saveThumb, isImageMime, isVideoMime } from '../lib/upload';

const router = Router();

function genReportId(): string {
  return `SR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
type Status = (typeof STATUS_FLOW)[number];

// ---------- CREATE (multipart: fields + optional media) ----------
router.post(
  '/',
  requireAuth,
  upload.single('media'),
  async (req: Request, res: Response) => {
    try {
      const { title, description, type, category, location, latitude, longitude } = req.body as {
        title?: string;
        description?: string;
        type?: string;
        category?: string;
        location?: string;
        latitude?: string;
        longitude?: string;
      };

      if (!title || title.trim().length < 4) {
        res.status(400).json({ error: 'Title must be at least 4 characters' });
        return;
      }
      if (!description || description.trim().length < 15) {
        res.status(400).json({ error: 'Description must be at least 15 characters' });
        return;
      }
      const reportType = type === 'EMERGENCY' ? 'EMERGENCY' : 'NON_EMERGENCY';

      // gather existing perceptual hashes for duplicate detection (last 500)
      const recent = await prisma.report.findMany({
        where: { mediaHash: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: { reportId: true, mediaHash: true },
      });

      let mediaUrl: string | undefined;
      let mediaType: string | undefined;
      let thumbUrl: string | undefined;
      let media: Parameters<typeof runAnalysis>[0]['media'] = null;

      if (req.file) {
        mediaType = isImageMime(req.file.mimetype) ? 'image' : isVideoMime(req.file.mimetype) ? 'video' : 'unknown';
        const name = saveBuffer(req.file.buffer, `${Date.now()}-${req.file.originalname.replace(/[^\w.-]+/g, '_').slice(-60)}`);
        mediaUrl = name;
        media = {
          kind: mediaType === 'video' ? 'video' : 'image',
          buffer: req.file.buffer,
          originalName: req.file.originalname || 'upload',
        };
      }

      const analysis = await runAnalysis({
        title: title.trim(),
        description: description.trim(),
        location: location?.trim(),
        media,
        existingHashes: recent
          .filter((r) => r.mediaHash)
          .map((r) => ({ reportId: r.reportId, hash: r.mediaHash as string })),
      });

      // image thumbnail for cards
      if (req.file && mediaType === 'image') {
        try {
          const Jimp = (await import('jimp')).default;
          const img = await Jimp.read(req.file.buffer);
          img.cover(320, 200).quality(70);
          const buf = await img.getBufferAsync(Jimp.MIME_JPEG);
          thumbUrl = saveThumb(buf);
        } catch {
          // thumb is best-effort
        }
      }

      const reportId = genReportId();
      // category: reporter's edit wins, else engine classification, else draft
      const finalCategory =
        category?.trim() ||
        (analysis.text.category !== 'Uncategorized'
          ? analysis.text.category
          : (analysis.suggestions?.category ?? null));
      const report = await prisma.report.create({
        data: {
          reportId,
          userId: req.user!.id,
          type: reportType as 'EMERGENCY' | 'NON_EMERGENCY',
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          location: location?.trim() || null,
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

      res.status(201).json({ report });
    } catch (err) {
      console.error('create report error', err);
      res.status(500).json({ error: 'Failed to submit report' });
    }
  }
);

// ---------- ANALYZE (preview only, no save) ----------
router.post(
  '/analyze',
  requireAuth,
  upload.single('media'),
  async (req: Request, res: Response) => {
    try {
      const title = (req.body.title as string) || '';
      const description = (req.body.description as string) || '';
      const location = (req.body.location as string) || '';
      let media: Parameters<typeof runAnalysis>[0]['media'] = null;
      if (req.file) {
        media = {
          kind: isVideoMime(req.file.mimetype) ? 'video' : 'image',
          buffer: req.file.buffer,
          originalName: req.file.originalname || 'upload',
        };
      }
      const analysis = await runAnalysis({ title, description, location, media });
      res.json({ analysis });
    } catch (err) {
      console.error('analyze error', err);
      res.status(500).json({ error: 'Analysis failed' });
    }
  }
);

// ---------- LIST: own reports ----------
router.get('/mine', requireAuth, async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const reports = await prisma.report.findMany({
    where: {
      userId: req.user!.id,
      ...(status && STATUS_FLOW.includes(status as Status) ? { status: status as Status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });
  res.json({ reports });
});

// ---------- LIST: admin/moderator all reports ----------
router.get('/all', requireAuth, requireRole('ADMIN', 'MODERATOR'), async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const q = (req.query.q as string | undefined)?.trim();
  const reports = await prisma.report.findMany({
    where: {
      ...(status && STATUS_FLOW.includes(status as Status) ? { status: status as Status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { reportId: { contains: q, mode: 'insensitive' as const } },
              { category: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ reports });
});

// ---------- PUBLIC TRACK by reportId ----------
router.get('/track/:reportId', async (req: Request, res: Response) => {
  const report = await prisma.report.findUnique({
    where: { reportId: req.params.reportId.toUpperCase() },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  // public view: strip reporter identity and internal scoring fields
  const { userId: _u, keywords: _k, mediaHash: _m, ...rest } = report;
  void _u;
  void _k;
  void _m;
  res.json({ report: rest });
});

// ---------- SINGLE REPORT (owner or admin) ----------
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const report = await prisma.report.findFirst({
    where: { OR: [{ id: req.params.id }, { reportId: req.params.id.toUpperCase() }] },
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  if (report.userId !== req.user!.id && !['ADMIN', 'MODERATOR'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Not your report' });
    return;
  }
  res.json({ report });
});

// ---------- STATUS UPDATE (admin/moderator) ----------
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('ADMIN', 'MODERATOR'),
  async (req: Request, res: Response) => {
    const { status, note } = req.body as { status?: string; note?: string };
    if (!status || !STATUS_FLOW.includes(status as Status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const report = await prisma.report.findFirst({
      where: { OR: [{ id: req.params.id }, { reportId: req.params.id.toUpperCase() }] },
    });
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    const updated = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: status as Status,
        events: {
          create: {
            to: status as Status,
            from: report.status,
            note: note?.trim() || null,
            actorId: req.user!.id,
          },
        },
      },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    res.json({ report: updated });
  }
);

// ---------- STATS (public) ----------
router.get('/', async (_req: Request, res: Response) => {
  const [total, byStatus, bySeverity] = await Promise.all([
    prisma.report.count(),
    prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.report.groupBy({ by: ['severity'], _count: { _all: true } }),
  ]);
  res.json({
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    bySeverity: Object.fromEntries(
      bySeverity.filter((s) => s.severity !== null).map((s) => [s.severity, s._count._all])
    ),
  });
});

export default router;
