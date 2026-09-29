# SAFEREPORT - Crime Reporting App
<div align="center">
  <br />
  <div>
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="prisma" />
  </div>

  <h3 align="center">Anonymous Crime Reporting App</h3>

   <div align="center">
     Report any incident anonymously — classified by built-in intelligence, tracked privately by you
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

SafeReport v2 is a complete rebuild: an enterprise-style anonymous incident
reporting platform. Anyone can report theft, fire, road accidents, flooding,
cybercrime, bullying, safety hazards — anything — without revealing their
identity. A **built-in intelligence engine** (fully local, no Gemini/OpenAI
keys) classifies every report, drafts the title/description from your evidence,
scores severity, and routes it to the right authority.

Login exists only so **you** can track your own submissions — reports
themselves are always submitted anonymously.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Express, JWT auth, multer uploads
- **Database:** Prisma + Neon (PostgreSQL)
- **Intelligence:** local engine (`backend/src/intelligence/`) — lexicon text
  classification, image/video forensics (sharpness, EXIF, perceptual hashing),
  fusion triage. No external AI API.
- **Bundling:** npm workspaces + a unified root server (`server.ts`)

## <a name="features">🔋 Features</a>

- Anonymous report intake (FORM SR-F2) with AI-drafted type/title/description — all editable
- Live report preview + analysis panel while you type
- GPS auto-detect location with city/pincode/country suggestions
- Private dashboard: your submissions, live status, auto-refresh from Neon
- Public report tracking by ID with full status timeline
- Admin moderation console with stats
- **Emergency Diary**: pick a city → country auto-selects → authority numbers with a confirm-popup → phone dialer handoff (never auto-dials)
- How It Works walkthrough + anonymity assurance

## <a name="structure">🏗️ Project Structure</a>

```
├── frontend/    Next.js UI (port 3000 in split dev)
├── backend/     Express API + Prisma/Neon + intelligence engine (port 4000 standalone)
├── server.ts    Unified server — runs BOTH on one port (dev & production)
├── package.json npm workspaces — one install for everything
└── .env.example ONE env file for the whole app
```

The two folders stay separate for development clarity, but the app **runs and
deploys as a single unit** through `server.ts`.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites:** [Node.js](https://nodejs.org/en), npm, Git

```bash
# Clone the repository
git clone https://github.com/anish-16/SAFEREPORT_Crime-Report-App.git
cd SAFEREPORT_Crime-Report-App

# Install everything (root + backend + frontend in one go)
npm install

# Configure env
cp .env.example .env        # paste your Neon DATABASE_URL + set JWT_SECRET

# Database
npm run db:push             # sync schema to Neon
npm run db:seed             # optional demo accounts

# Run — ONE process serves UI + API together
npm run dev                 # → http://localhost:3000
```

### All commands

| Command | What it does |
|---|---|
| `npm run dev` | **Unified dev server** — API + UI in one process on `:3000` |
| `npm run dev:split` | Old two-process dev — API `:4000` + UI `:3000` (UI proxies `/api`) |
| `npm run build` | Typecheck backend + production build of the UI |
| `npm start` | **Production** — one process serving everything |
| `npm run typecheck` | TS checks for backend, frontend and the unified server |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma against your Neon database |

Seeded logins: `admin@safereport.app` / `password123` (ADMIN) and
`demo@safereport.app` / `password123` (USER).

## <a name="environment">🕸️ Environment Setup</a>

One file: `.env` in the repo root (see `.env.example`):

```env
DATABASE_URL="postgresql://...your Neon connection string..."
JWT_SECRET="long-random-string"
JWT_EXPIRES_IN="7d"        # optional
PORT=3000                  # optional locally; hosts set this for you
```

`backend/.env` is also still honored if you prefer split-mode dev.

## <a name="deployment">🚀 Deployment — one folder, one service</a>

Because of npm workspaces + the unified `server.ts`, this repo is a **single
deployable unit**: one install, one build command, one start command, one port.
Any host that runs Node.js can host the whole app.

| Setting | Value |
|---|---|
| Install command | `npm install` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Environment | `DATABASE_URL`, `JWT_SECRET` (host injects `PORT`) |

Works on **Render, Railway, Fly.io, a VPS, Docker** — anything with a
long-running Node process.

> ⚠️ Not Vercel/serverless: the app needs a persistent Node server (Express +
> local intelligence engine + file uploads). Push to GitHub, create a Node
> service for this repo, add the two env vars — done.

How the bundle works: `server.ts` mounts the Express app (`/api/*`,
`/uploads/*`) first, then hands everything else to Next.js' request handler —
same process, same port, zero CORS, no second service to host.

## Author
- *Anish Kumar*
*✉️ akanish1607@gmail.com*
