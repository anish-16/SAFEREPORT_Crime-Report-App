import { prisma } from '@/lib/server/prisma';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

/** PATCH /api/admin/users/:id/role — admin only. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session.user) return jsonError(401, 'Authentication required');
  if (session.user.role !== 'ADMIN') return jsonError(403, 'Insufficient permissions');

  const { role } = (await req.json()) as { role?: string };
  if (!role || !['USER', 'MODERATOR', 'ADMIN'].includes(role)) return jsonError(400, 'Invalid role');

  const user = await prisma.user.update({
    where: { id },
    data: { role: role as 'USER' | 'MODERATOR' | 'ADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });
  return jsonOk({ user });
}
