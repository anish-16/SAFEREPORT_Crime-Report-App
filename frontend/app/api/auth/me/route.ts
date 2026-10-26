import { prisma } from '@/lib/server/prisma';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

export async function GET(req: Request): Promise<Response> {
  const { user } = getSession(req);
  if (!user) return jsonError(401, 'Authentication required');
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return jsonError(401, 'Account no longer exists');
  return jsonOk({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
    },
  });
}
