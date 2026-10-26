import fs from 'fs';
import { mimeForFile, resolveUpload } from '@/lib/server/upload';

/**
 * GET /uploads/<path> — serves evidence files and thumbnails written at
 * runtime into `frontend/uploads` (replaces the old Express static mount).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path: parts } = await ctx.params;
  const abs = resolveUpload(decodeURIComponent(parts.join('/')));
  if (!abs) return new Response('Bad path', { status: 400 });

  try {
    const buf = await fs.promises.readFile(abs);
    return new Response(new Uint8Array(buf), {
      headers: {
        'content-type': mimeForFile(abs),
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
