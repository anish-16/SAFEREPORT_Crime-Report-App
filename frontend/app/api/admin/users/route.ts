import { prisma } from '@/lib/server/prisma';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

/** GET /api/admin/users — admin only. */
export async function GET(req: Request): Promise<Response> {
  const session = getSession(req);
  if (!session.user) return jsonError(401, 'Authentication required');
  if (session.user.role !== 'ADMIN') return jsonError(403, 'Insufficient permissions');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { reports: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return jsonOk({ users });
}
