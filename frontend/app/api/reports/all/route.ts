import { prisma } from '@/lib/server/prisma';
import { getSession, isAdmin } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
type Status = (typeof STATUS_FLOW)[number];

/** GET /api/reports/all — admin/moderator console listing. */
export async function GET(req: Request): Promise<Response> {
  const session = getSession(req);
  if (!session.user) return jsonError(401, 'Authentication required');
  if (!isAdmin(session)) return jsonError(403, 'Insufficient permissions');

  const params = new URL(req.url).searchParams;
  const status = params.get('status') ?? undefined;
  const q = params.get('q')?.trim();

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

  return jsonOk({ reports });
}
