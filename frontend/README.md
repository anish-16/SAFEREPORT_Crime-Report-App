# SafeReport — Frontend

Next.js 15 (App Router) + Tailwind CSS.

Talks to the API on the **same origin** (`/api`):

- **Unified mode** (`npm run dev` / `npm start` at the repo root) — the root
  `server.ts` serves the UI and the API on one port.
- **Split mode** (`npm run dev:split`) — `next dev` proxies `/api` and
  `/uploads` to the standalone backend on `:4000` (see `next.config.ts`).

No `.env` file required. Optional override for a split deploy without the proxy:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
