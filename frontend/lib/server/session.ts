import { verifyToken } from './jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Session {
  user: AuthUser | null;
  /** Anonymous, browser-generated key that scopes reports to one device. */
  deviceId: string | null;
}

const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** Reads the optional Bearer token and the optional X-Device-Id header. */
export function getSession(req: Request): Session {
  let user: AuthUser | null = null;
  const header = req.headers.get('authorization');
  if (header && header.startsWith('Bearer ')) {
    try {
      const p = verifyToken(header.slice(7));
      user = { id: p.sub, email: p.email, name: p.name, role: p.role };
    } catch {
      // expired/invalid token — treat as anonymous guest
    }
  }
  const raw = req.headers.get('x-device-id');
  const deviceId = raw && DEVICE_RE.test(raw) ? raw : null;
  return { user, deviceId };
}

export function isAdmin(session: Session): boolean {
  return session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR';
}
