# SafeReport — API

Express + Prisma (Neon Postgres) + built-in local intelligence engine.
No Gemini/OpenAI keys required — analysis runs in `src/intelligence/`.

- `POST /api/auth/signup` · `POST /api/auth/login` · `GET /api/auth/me`
- `POST /api/reports` (auth, multipart) — submit + auto-analyze
- `POST /api/reports/analyze` (auth, multipart) — preview analysis only
- `GET /api/reports/mine` (auth) — own reports
- `GET /api/reports/all` (admin/moderator) — all reports
- `GET /api/reports/track/:reportId` — public tracking
- `GET /api/reports/:id` (auth, owner/admin)
- `PATCH /api/reports/:id/status` (admin/moderator)
- `GET /api/reports` — public stats
- `GET /api/admin/*` — admin overview & user roles

Scripts: `npm run dev` · `npm run db:push` · `npm run seed` · `npm run typecheck`
