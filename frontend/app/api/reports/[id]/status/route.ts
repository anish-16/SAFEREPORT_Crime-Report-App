import { prisma } from '@/lib/server/prisma';
import { getSession, isAdmin } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

const STATUS_FLOW = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const;
type Status = (typeof STATUS_FLOW)[number];

/** PATCH /api/reports/:id/status — admin/moderator status transitions. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session.user) return jsonError(401, 'Authentication required');
  if (!isAdmin(session)) return jsonError(403, 'Insufficient permissions');

  const { status, note } = (await req.json()) as { status?: string; note?: string };
  if (!status || !STATUS_FLOW.includes(status as Status)) return jsonError(400, 'Invalid status');

  const report = await prisma.report.findFirst({
    where: { OR: [{ id }, { reportId: id.toUpperCase() }] },
  });
  if (!report) return jsonError(404, 'Report not found');

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: status as Status,
      events: {
        create: {
          to: status as Status,
          from: report.status,
          note: note?.trim() || null,
          actorId: session.user.id,
        },
      },
    },
    include: { events: { orderBy: { createdAt: 'asc' } } },
  });
  return jsonOk({ report: updated });
}
