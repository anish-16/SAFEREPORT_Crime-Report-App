import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/prisma';
import { signToken } from '@/lib/server/jwt';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

/** Attaches reports filed on this device as a guest to the account on sign-in. */
async function claimGuestReports(userId: string, req: Request): Promise<void> {
  const { deviceId } = getSession(req);
  if (!deviceId) return;
  await prisma.report
    .updateMany({ where: { deviceId, userId: null }, data: { userId } })
    .catch(() => undefined);
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) return jsonError(400, 'Email and password are required');

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return jsonError(401, 'Invalid email or password');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return jsonError(401, 'Invalid email or password');

    await claimGuestReports(user.id, req);

    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return jsonOk({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error', err);
    return jsonError(500, 'Failed to sign in');
  }
}

function publicUser(u: { id: string; email: string; name: string; role: string; createdAt: Date }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
}
