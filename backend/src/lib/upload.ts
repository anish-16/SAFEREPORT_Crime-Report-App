import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs');

for (const dir of [UPLOAD_DIR, THUMB_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

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

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 }, // 60 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(new Error('Unsupported file type. Use an image (jpg/png/webp/gif) or video (mp4/mov/webm).'));
  },
});

export function safeFileName(originalName: string): string {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 10) || '.bin';
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

export function saveBuffer(buffer: Buffer, name: string): string {
  const file = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(file, buffer);
  return `/uploads/${name}`;
}

export function saveThumb(buffer: Buffer): string {
  const name = `thumb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  fs.writeFileSync(path.join(THUMB_DIR, name), buffer);
  return `/uploads/thumbs/${name}`;
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/');
}
