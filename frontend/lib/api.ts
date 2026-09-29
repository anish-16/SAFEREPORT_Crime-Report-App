// Same-origin by default: the unified server (repo-root server.ts) answers
// /api on the same port as the UI, and `next dev` proxies /api to the backend
// in split mode — so no API origin env var is needed. Only set
// NEXT_PUBLIC_API_URL for a split deploy without the dev proxy (keep the /api suffix).
const configured = process.env.NEXT_PUBLIC_API_URL;
const BASE =
  configured && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(configured) ? configured : '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sr_token');
}

export function setSession(t: string) {
  localStorage.setItem('sr_token', t);
}

export function clearSession() {
  localStorage.removeItem('sr_token');
}

export function hasSession(): boolean {
  return token() !== null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const t = token();
  if (t) headers.set('Authorization', `Bearer ${t}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
};
