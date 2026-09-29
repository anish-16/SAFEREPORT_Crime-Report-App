import './lib/env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import { UPLOAD_DIR } from './lib/upload';

/**
 * The Express app on its own — no listen() here, so it can run two ways:
 *  - standalone (src/index.ts)  → API alone on :4000  (npm run dev:split)
 *  - unified   (repo-root server.ts) → API + Next.js UI on ONE port (npm run dev / npm start)
 */
export const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json({ limit: '2mb' }));

// uploaded media (evidence files)
app.use('/uploads', express.static(path.join(UPLOAD_DIR)));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'safereport-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// multer / generic error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('unhandled error:', err.message);
  res.status(400).json({ error: err.message || 'Request failed' });
});

/**
 * Port resolution. Hosts inject $PORT; some sandboxes export PORT=0, which
 * would bind a random unusable port — so reject 0/NaN/out-of-range and fall
 * back to the caller's default (4000 standalone, 3000 unified).
 */
export function resolvePort(fallback: number): number {
  const raw = Number(process.env.PORT);
  return Number.isInteger(raw) && raw >= 1 && raw < 65536 ? raw : fallback;
}
