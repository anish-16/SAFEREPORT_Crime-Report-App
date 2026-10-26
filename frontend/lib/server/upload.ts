import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Evidence files live in `frontend/uploads` (gitignored), written at runtime
 * and served back by `app/uploads/[...path]/route.ts`. Values stored in the
 * database keep the historical `/uploads/<name>` shape.
 */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
export const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs');

for (const dir of [UPLOAD_DIR, THUMB_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024; // 60 MB

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm']);

export function isAllowedUpload(name: string, mime: string): boolean {
  const ext = path.extname(name || '').toLowerCase();
  return ALLOWED_MIME.has(mime) || ALLOWED_EXT.has(ext);
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}

export function saveBuffer(buffer: Buffer, name: string): string {
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

export function saveThumb(buffer: Buffer): string {
  const name = `thumb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  fs.writeFileSync(path.join(THUMB_DIR, name), buffer);
  return `/uploads/thumbs/${name}`;
}

/** Resolve a URL path inside the upload dir, refusing traversal (`..`). */
export function resolveUpload(relativePath: string): string | null {
  const clean = relativePath.replace(/^\/+/, '');
  const abs = path.resolve(UPLOAD_DIR, clean);
  if (abs !== UPLOAD_DIR && !abs.startsWith(UPLOAD_DIR + path.sep)) return null;
  return abs;
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

export function mimeForFile(file: string): string {
  return MIME_BY_EXT[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
