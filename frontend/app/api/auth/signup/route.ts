import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/prisma';
import { signToken } from '@/lib/server/jwt';
import { getSession } from '@/lib/server/session';
import { jsonError, jsonOk } from '@/lib/server/http';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Links any reports this browser filed as a guest to the fresh account. */
async function claimGuestReports(userId: string, req: Request): Promise<void> {
  const { deviceId } = getSession(req);
  if (!deviceId) return;
  await prisma.report
    .updateMany({ where: { deviceId, userId: null }, data: { userId } })
    .catch(() => undefined);
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || name.trim().length < 2) return jsonError(400, 'Name must be at least 2 characters');
    if (!email || !EMAIL_RE.test(email)) return jsonError(400, 'A valid email is required');
    if (!password || password.length < 6) return jsonError(400, 'Password must be at least 6 characters');

    const normalized = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) return jsonError(409, 'An account with this email already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name: name.trim(), email: normalized, password: hashed },
    });

    await claimGuestReports(user.id, req);

    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return jsonOk({ token, user: publicUser(user) }, 201);
  } catch (err) {
    console.error('signup error', err);
    return jsonError(500, 'Failed to create account');
  }
}

function publicUser(u: { id: string; email: string; name: string; role: string; createdAt: Date }) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
}
