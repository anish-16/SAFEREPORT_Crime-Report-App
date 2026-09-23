import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import { UPLOAD_DIR } from './lib/upload';

const app = express();
// Environments sometimes export PORT=0 or other invalid values — validate it.
const rawPort = Number(process.env.PORT);
const PORT = Number.isInteger(rawPort) && rawPort > 1023 && rawPort < 65536 ? rawPort : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json({ limit: '2mb' }));

// uploaded media
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

app.listen(PORT, () => {
  console.log(`🛡  SafeReport API listening on http://localhost:${PORT}`);
});
