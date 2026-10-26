import { prisma } from '@/lib/server/prisma';
import { getSession, isAdmin } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

/**
 * GET /api/reports/:id — the signed-in owner, this device's guest reports,
 * or an admin/moderator.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session.user && !session.deviceId) return jsonError(401, 'Authentication required');

  const report = await prisma.report.findFirst({
    where: { OR: [{ id }, { reportId: id.toUpperCase() }] },
    include: {
      events: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!report) return jsonError(404, 'Report not found');

  const mine =
    (session.user && report.userId === session.user.id) ||
    (session.deviceId && report.deviceId === session.deviceId) ||
    isAdmin(session);
  if (!mine) return jsonError(403, 'Not your report');

  return jsonOk({ report });
}
