# Angkop — Codebase Setup Checklist

Work through this top to bottom. Each section depends on the one above it.

---

## 1. Prerequisites

- [x] Node.js 22.x installed — v22.22.3
- [x] pnpm 11.x installed — v11.6.0
- [x] Python 3.12 installed via pyenv — v3.12.0 (`pyenv local 3.12.0` set in project)
- [x] Docker Desktop installed — v29.5.2
- [x] Git configured with your GitHub account

---

## 2. Root Monorepo

- [x] Create `package.json` at root (name: `angkop`, private, pnpm engine)
- [x] Create `pnpm-workspace.yaml` pointing to `apps/*` and `packages/*`
- [x] Create `turbo.json` with `dev`, `build`, `lint`, `type-check` tasks
- [x] Create `tsconfig.base.json` with shared strict TypeScript config
- [x] Run `pnpm install` from the root to initialize the workspace

---

## 3. Next.js Dashboard (`apps/web`)

- [ ] Scaffold with `pnpm create next-app@latest` inside `apps/web` (App Router, TypeScript)
- [ ] `tsconfig.json` extending base (bundler module resolution)
- [ ] `next.config.ts` — base config
- [ ] Install and init shadcn/ui: `pnpm dlx shadcn@latest init`
- [ ] Install base shadcn components needed across the app (button, input, card, dialog, etc.)

---

## 4. Web App Folder Structure (`apps/web`)

Set up the folder structure following the module-based pattern:

```
apps/web/
├── app/
│   ├── layout.tsx                        # root layout
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── page.tsx                      # job feed / matches
│       ├── profile/page.tsx
│       ├── skill-gaps/page.tsx
│       └── applications/page.tsx
├── modules/                              # all page-specific components grouped by feature
│   ├── login-page/
│   ├── register-page/
│   ├── dashboard-page/                   # job feed, match cards
│   ├── profile-page/
│   ├── skill-gaps-page/
│   └── applications-page/
├── components/                           # shared UI components used across pages
├── hooks/                                # custom React hooks
├── lib/                                  # apollo client, supabase client, utilities
├── constants/                            # static data and config values
└── providers/                            # React context providers
```

- [ ] Create all `app/` route folders and placeholder `page.tsx` files
- [ ] Create empty `modules/`, `components/`, `hooks/`, `lib/`, `constants/`, `providers/` folders
- [ ] `lib/apollo-client.ts` — Apollo Client pointed at the Express API
- [ ] `.env.local.example` — document `NEXT_PUBLIC_API_URL` and Supabase keys
- [ ] Run `pnpm --filter @angkop/web dev` and confirm dashboard loads

---

## 6. Shared Package (`packages/shared`)

- [ ] `package.json` — name: `@angkop/shared`
- [ ] `tsconfig.json` extending base
- [ ] `src/index.ts` — shared TypeScript types (Platform, Job, UserProfile, JobMatch, SkillGap, ML contracts)
- [ ] Run `pnpm --filter @angkop/shared build` to confirm it compiles

---

## 7. Express API (`apps/server`)

- [ ] `package.json` — name: `@angkop/server`, add dependencies:
  - `express`, `@apollo/server`, `graphql`
  - `@prisma/client`, `prisma`
  - `ioredis`, `jose`, `cors`
  - `pino`, `pino-pretty`
  - `@angkop/shared` (workspace)
- [ ] `tsconfig.json` extending base (CommonJS target)
- [ ] `src/lib/logger.ts` — pino logger instance
- [ ] `src/lib/prisma.ts` — singleton Prisma client
- [ ] `src/lib/redis.ts` — ioredis client + cache helpers
- [ ] `src/graphql/schema.ts` — GraphQL type definitions
- [ ] `src/graphql/resolvers/index.ts` — resolver stubs
- [ ] `src/middleware/authenticate.ts` — JWT verification via `jose`
- [ ] `src/routes/auth.ts` — Supabase Auth endpoints
- [ ] `src/routes/events.ts` — behavior event ingestion from extension
- [ ] `src/index.ts` — Express + Apollo Server entry point
- [ ] `prisma/schema.prisma` — define all models (see section 8)
- [ ] `.env.example` — document all required env vars
- [ ] Run `pnpm --filter @angkop/server dev` and confirm server starts

---

## 8. Browser Extension (`apps/extension`)

- [ ] `manifest.json` — Manifest V3, declare permissions and content scripts
- [ ] `src/background/service-worker.js` — background service worker
- [ ] `src/content/content.js` — content script per supported platform:
  - JobStreet, Indeed, LinkedIn, Kalibrr, PhilJobNet, Glassdoor
- [ ] `src/overlay/overlay.js` — injects match score badge onto listing pages
- [ ] `popup/popup.html` + `popup.js` — extension popup UI
- [ ] `icons/` — extension icons (16, 48, 128px)
- [ ] Sideload in Chrome (`chrome://extensions` → Developer mode → Load unpacked)
- [ ] Confirm content script fires on a supported job platform

---

## 9. Database — Prisma Schema (`apps/server/prisma/schema.prisma`)

- [ ] Configure `datasource db` with `provider = "postgresql"` and `DATABASE_URL`
- [x] Define models (all use soft-delete: `deleted Boolean @default(false)`) — defined in
      `schema.prisma`; `SavedJob`/`SavedCourse` added but not yet migrated:
  - `User` — id, email, name, createdAt, updatedAt, deleted
  - `UserProfile` — skills, education (Json), experience (Json), preferences (Json)
  - `Job` — platformJobId, platform, title, company, description, url, embedding (Float[])
  - `Interaction` — userId, jobId, eventType, weight, platform
  - `SkillGapRecord` — userId, jobId, skill, confidence, courses (Json)
  - `SavedJob` — userId, jobId, status (`ApplicationStatus` enum: PENDING → APPLIED →
    AWAITING_INTERVIEW → ONGOING_INTERVIEW → INTERVIEWED → SUCCESSFUL/UNSUCCESSFUL), tags
    (String[]), interviewDate — Epic 8's application tracking
  - `SavedCourse` — userId, title, provider, url — Epic 8's "save a course for later"
- [ ] Run `prisma generate` to generate the client
- [ ] Run `prisma db push` to apply schema to Supabase

---

## 10. ML Microservice (`ml/`)

- [ ] Create a Python virtual environment (`python -m venv .venv`)
- [ ] `requirements.txt` — pin dependencies:
  - `fastapi`, `uvicorn[standard]`
  - `sentence-transformers`, `transformers`
  - `torch` (CPU or CUDA build)
  - `numpy`, `scipy`
  - `redis`, `asyncpg`, `psycopg2-binary`
- [ ] `app/main.py` — FastAPI app entry, mount routers
- [ ] `app/config.py` — settings from env vars (DATABASE_URL, REDIS_URL, etc.)
- [ ] `app/routers/embeddings.py` — `POST /embed` endpoint
- [ ] `app/routers/recommendations.py` — `POST /recommend` endpoint (NCF inference)
- [ ] `app/routers/skill_gap.py` — `POST /skill-gap` endpoint
- [ ] `app/models/ncf.py` — NCF model architecture (GMF + MLP via PyTorch)
- [ ] `Dockerfile` — containerize for Render/Railway deployment
- [ ] `.env.example` — document all env vars
- [ ] Run `uvicorn app.main:app --reload` and hit `/docs` to confirm Swagger loads

---

## 11. External Services

- [ ] **Supabase** — create project, copy `DATABASE_URL` and anon/service keys
- [ ] **Supabase Auth** — enable Email provider
- [ ] **Redis** — run locally via Docker: `docker run -p 6379:6379 redis:7`
- [ ] **Google Colab** — set up NCF training notebook (separate from this repo)

---

## 12. Environment Variables

Fill in `.env` / `.env.local` for each app before running:

**`apps/server/.env`**
```
DATABASE_URL=
REDIS_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
JWT_SECRET=
ML_SERVICE_URL=http://localhost:8000
WEB_URL=http://localhost:3000
PORT=4000
```

**`apps/web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**`ml/.env`**
```
DATABASE_URL=
REDIS_URL=
MODEL_NAME=all-MiniLM-L6-v2
NCF_WEIGHTS_PATH=./weights/ncf.pt
```

---

## 13. First Full Run Verification

- [ ] `pnpm dev` from root starts all JS services via Turborepo
- [ ] `uvicorn app.main:app --reload` starts the ML microservice
- [ ] Dashboard loads at `http://localhost:3000`
- [ ] GraphQL playground accessible at `http://localhost:4000/graphql`
- [ ] ML service Swagger at `http://localhost:8000/docs`
- [ ] Extension overlay appears on a supported job listing page
