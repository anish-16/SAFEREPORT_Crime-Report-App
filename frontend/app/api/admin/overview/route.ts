import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getSession, isAdmin } from '@/lib/server/session';

function deny(): NextResponse {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

/** GET /api/admin/overview — dashboard stats for the moderation console. */
export async function GET(req: Request): Promise<Response> {
  const session = getSession(req);
  if (!session.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!isAdmin(session)) return deny();

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
  return Response.json({
    totalReports,
    totalUsers,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    recent,
  });
}
