# SAFEREPORT — Anonymous Crime Reporting App
<div align="center">
  <br />
  <div>
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextjs" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="prisma" />
  </div>

  <h3 align="center">Anonymous Crime Reporting App</h3>

  <div align="center">
    Report any incident anonymously — classified by built-in intelligence plus your own AI key,
    tracked privately in your browser. No account needed.
  </div>
</div>

## 📋 Table of Contents

1. 🤖 [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🏗️ [Project Structure](#structure)
5. 🤸 [Quick Start](#quick-start)
6. 🕸️ [Environment Setup](#environment)
7. 🚀 [Deployment](#deployment)

## <a name="introduction">🤖 Introduction</a>

SafeReport is an enterprise-style anonymous incident reporting platform. Anyone can report
theft, fire, road accidents, flooding, cybercrime, bullying, safety hazards — anything —
without an account and without revealing their identity.

**The `frontend/` folder is the entire application**: Next.js UI, API route handlers
(`app/api/*`), evidence uploads (`app/uploads/*`), Prisma/Neon, the local intelligence
engine (`lib/server/intelligence/`) and the pluggable AI provider (`lib/server/ai.ts`).
One folder, one command, one service.

Analysis happens in two layers:

1. **Built-in local engine** — lexicon classification, image/video forensics (sharpness,
   EXIF, perceptual hashing) and fusion triage. No key, no external calls, always on.
2. **Your AI key (optional)** — paste the API key of *any* provider in **Settings → AI**
   (OpenAI, Groq, OpenRouter, DeepSeek, xAI, Mistral, Anthropic, Gemini, any
   OpenAI-compatible endpoint) and every report is also classified, re-written and triaged
   by that model. The key is stored server-side, encrypted, and never sent to the browser.
   If the provider fails, the local result still stands.

**Login is optional.** Each browser keeps a random tracking key, so you can submit reports
and watch their full status timeline under **My Reports** with no account. Signing in later
automatically attaches this browser's reports to your account. Accounts exist for the
admin/moderation console.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **App:** Next.js 15 (App Router, route handlers), TypeScript, Tailwind CSS
- **Database:** Prisma + Neon (PostgreSQL)
- **Intelligence:** local engine (`frontend/lib/server/intelligence/`) + pluggable AI
  provider with encrypted bring-your-own-key storage
- **Auth (optional):** JWT — admin/moderation only; guests are identified by a
  browser-generated device key (`X-Device-Id`)

## <a name="features">🔋 Features</a>

- **Passwordless** anonymous report intake (FORM SR-F2) — submit in seconds, no signup
- **My Reports dashboard without login** — every submission, live status, auto-refresh
- AI-drafted type/title/description/category — local engine, upgraded by your AI key — all editable
- Live report preview + analysis panel while you type (local pass immediately, AI pass once the draft settles)
- Bring-your-own-key **Settings → AI**: auto-detects the provider from the key, test button, masked key, encrypted at rest
- Public report tracking by ID with full status timeline
- GPS auto-detect location with city/pincode/country suggestions
- Admin moderation console with stats (sign-in required)
- **Emergency Diary**: pick a city → country auto-selects → authority numbers with a confirm-popup → phone dialer handoff (never auto-dials)
- How It Works walkthrough + anonymity assurance

## <a name="structure">🏗️ Project Structure</a>

```
frontend/
├── app/                 # UI pages (submit, dashboard, track, settings, admin, …)
│   ├── api/             # Express-style API as Next.js route handlers (/api/*)
│   └── uploads/         # GET handler serving runtime evidence files
├── components/          # UI components (navbar, analysis panel, report cards…)
├── lib/                 # client helpers (api, auth context) + server modules
│   └── server/          # prisma · jwt · session · upload · ai · intelligence/
├── prisma/              # schema.prisma + seed.ts (Neon)
└── uploads/             # evidence files written at runtime (gitignored)
package.json             # the app's dependencies and scripts
.env                     # DATABASE_URL, JWT_SECRET, optional AI_* keys
```

The old `backend/` workspace and root `server.ts` are gone — the frontend runs and deploys
as the single unit.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites:** [Node.js](https://nodejs.org/en), npm, Git

```bash
git clone https://github.com/anish-16/SAFEREPORT_Crime-Report-App.git
cd SAFEREPORT_Crime-Report-App

npm install

cp .env.example .env        # paste your Neon DATABASE_URL + set JWT_SECRET
# (or: cp frontend/.env.example frontend/.env)

npm run db:push             # sync schema to Neon
npm run db:seed             # optional admin/demo accounts

npm run dev                 # → http://localhost:3000
```

Open it and submit a report — no login. Then check **My Reports** to watch its status.

### All commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the app (delegates to `frontend`: `next dev --turbopack`) |
| `cd frontend && npm run dev` | The same thing, frontend folder as the main entry |
| `npm run build` | Production build of the app |
| `npm start` | Production server (UI + API + uploads on one port) |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma against your Neon database |

Admin console login (after seeding): `admin@safereport.app` / `password123`.

### Plugging in any AI

1. Sign in as admin → **AI Settings** (`/settings`).
2. Paste the provider key (auto-detected), optionally pick a model, **Save**.
3. **Test connection** — you should get a reply from the model.
4. Every report now gets the AI pass on top of the local engine.

Environment alternative: set `AI_API_KEY` (+ optional `AI_PROVIDER`, `AI_MODEL`) in `.env`.

## <a name="environment">🕸️ Environment Setup</a>

One file: `.env` at the repo root or `frontend/.env` (see `.env.example`):

```env
DATABASE_URL="postgresql://...your Neon connection string..."
JWT_SECRET="long-random-string"
JWT_EXPIRES_IN="7d"        # optional
PORT=3000                  # optional locally; hosts set this for you

# optional — or just save the key in Settings → AI
AI_API_KEY="sk-..."
AI_PROVIDER="openai"
AI_MODEL="gpt-4o-mini"
```

## <a name="deployment">🚀 Deployment — one folder, one service</a>

Because everything lives in `frontend/` behind npm workspaces, this repo is a single
deployable unit: one install, one build command, one start command, one port.

| Setting | Value |
|---|---|
| Install command | `npm install` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Environment | `DATABASE_URL`, `JWT_SECRET` (host injects `PORT`; optional `AI_API_KEY`) |

Works on **Render, Railway, Fly.io, a VPS, Docker** — anything that runs Node.js.

> ⚠️ Not Vercel/serverless: the app needs a persistent Node server (evidence uploads are
> written to `frontend/uploads/` at runtime).

## Author
- *Anish Kumar*
*✉️ akanish1607@gmail.com*
