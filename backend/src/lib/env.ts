import dotenv from 'dotenv';
import path from 'path';

/**
 * One source of env truth for every entrypoint (standalone API, unified
 * root server, prisma seed).
 *
 * 1. project-root .env  — canonical file when the whole app runs as ONE service
 * 2. backend/.env       — still honored for split local dev
 *
 * Values already present in process.env (hosting dashboard like Render/
 * Railway) always win, because dotenv never overrides existing keys.
 */
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
