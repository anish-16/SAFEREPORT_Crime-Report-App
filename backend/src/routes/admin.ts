import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { reports: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ users });
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: role as 'USER' | 'MODERATOR' | 'ADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json({ user });
});

router.get('/overview', async (_req: Request, res: Response) => {
  const [totalReports, totalUsers, byStatus, recent] = await Promise.all([
    prisma.report.count(),
    prisma.user.count(),
    prisma.report.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { reportId: true, title: true, status: true, severity: true, createdAt: true, category: true },
    }),
  ]);
  res.json({
    totalReports,
    totalUsers,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    recent,
  });
});

export default router;
