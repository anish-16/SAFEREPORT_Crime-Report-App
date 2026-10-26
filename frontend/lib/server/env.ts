import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Next.js loads `frontend/.env` on its own for route handlers, but scripts
 * that run outside Next (prisma seed, db:push helpers) need it too.
 * Values already in process.env (hosting dashboards like Render) always win —
 * dotenv never overwrites existing keys.
 */
const candidates = [
  path.resolve(process.cwd(), '.env'), // frontend/.env when run via `npm run … -w frontend`
  path.resolve(process.cwd(), '../.env'), // repo root .env
];

for (const file of candidates) {
  if (fs.existsSync(file)) dotenv.config({ path: file });
}
