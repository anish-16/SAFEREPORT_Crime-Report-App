/**
 * SafeReport unified server — ONE process, ONE port.
 *
 * Serves the Express API (/api/*, /uploads/*) and the Next.js UI from a single
 * entry point, so the whole project deploys as ONE service anywhere Node.js
 * runs (Render, Railway, Fly.io, a VPS, Docker...). The frontend/ and
 * backend/ folders stay exactly as they are — nothing is merged or compromised.
 *
 *   dev:   npm run dev              (tsx watch server.ts, Next.js in dev mode)
 *   prod:  npm run build && npm start
 */
import './backend/src/lib/env'; // must be first: loads .env before Prisma boots
import path from 'path';
import { app, resolvePort } from './backend/src/app';

// Production unless explicitly in dev. `--prod` avoids shell-specific
// VAR=value syntax so npm start works in cmd, PowerShell and bash alike.
const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
process.env.NODE_ENV = isProd ? 'production' : 'development';

// PostCSS/Tailwind discover their config from process.cwd(), and Next.js' dev
// compiler runs inside THIS process — so chdir into frontend/ and unified dev
// compiles styles exactly like `next dev` does there. Everything else (env
// files, uploads, Prisma, the frontend dir below) resolves from __dirname and
// is unaffected by the working directory.
process.chdir(path.join(__dirname, 'frontend'));

type NextHandler = (
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
) => Promise<void>;

type NextFactory = (opts: { dev: boolean; dir: string }) => {
  prepare(): Promise<void>;
  getRequestHandler(): NextHandler;
};

// require() instead of a top-level import so Next.js boots only AFTER
// NODE_ENV is settled above.
const next = require('next') as NextFactory;
const nextApp = next({ dev: !isProd, dir: path.join(__dirname, 'frontend') });
const handle = nextApp.getRequestHandler();

// Unknown API routes must answer JSON, never fall through to a Next.js page.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Everything else — pages, /_next assets, favicon — is Next.js' job.
app.use((req, res) => {
  handle(req, res).catch((err: unknown) => {
    console.error('next handler failed:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  });
});

const PORT = resolvePort(3000);

nextApp
  .prepare()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `🛡  SafeReport (${isProd ? 'production' : 'development'}) ready → http://localhost:${PORT}`,
      );
    });
  })
  .catch((err: unknown) => {
    console.error('Failed to start Next.js:', err);
    process.exit(1);
  });
