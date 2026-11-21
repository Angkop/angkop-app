# angkop-app
Angkop sa'yo, angkop sa trabaho.

Hybrid job matching and career recommendation system for Filipino job seekers. Sentence-BERT
semantic matching plus Neural Collaborative Filtering, served through an Express/GraphQL API,
a FastAPI ML service, a Next.js dashboard and a Chrome extension. See `CLAUDE.md` for the full
project context.

## Running it locally

Everything below runs on your own machine. The deployed app's ngrok tunnel to the ML service is
not involved, so it doesn't matter whether anyone else's laptop is on.

### 1. Prerequisites

- Node.js 22.x and pnpm 11.x
- Python 3.12 (pyenv is the easiest way, see `ONBOARDING.md`)
- Git access to this repo

Docker is optional. `docker-compose.yml` only starts a local Postgres and Redis, and the normal
setup uses the shared cloud ones (see step 3).

### 2. Install

```bash
git clone <repo-url>
cd angkop-app
pnpm install

cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # pulls in PyTorch, so it's slow
cd ..
```

### 3. Environment files

None of these are committed. Copy each `.env.example` and fill it in. **Anything marked
"ask Dre" is a secret or a credential for a shared service. Don't create your own, and don't
commit it.**

**`apps/server/.env`**

| Variable | Value |
|---|---|
| `DATABASE_URL` | ask Dre (shared Supabase Postgres, pooled connection) |
| `SUPABASE_URL` | ask Dre |
| `SUPABASE_SERVICE_KEY` | ask Dre |
| `REDIS_URL` | ask Dre (shared Upstash Redis) |
| `ML_SERVICE_URL` | `http://localhost:8000` |
| `WEB_URL` | `http://localhost:3000` |
| `PORT` | `4000` |
| `DIRECT_URL` | not needed unless you run Prisma migrations, which the team does manually |
| `HEADCOUNTLABS_API_KEY` | only for `pnpm ingest:jobs`, ask Dre |

**`apps/web/.env.local`**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_SUPABASE_URL` | ask Dre |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ask Dre |

**`ml/.env`**

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | ask Dre. The service refuses to start without one. Any dummy value lets it boot, but resume import, match insights and application drafts won't work |
| `SUPABASE_URL` | ask Dre. Used to download the NCF weights on first boot |
| `SUPABASE_SERVICE_KEY` | ask Dre. Same as above |
| `YOUTUBE_API_KEY` | optional, ask Dre. Only used for fallback course lookups |
| `MODEL_NAME`, `NCF_WEIGHTS_PATH`, `NCF_ID_MAPPING_PATH`, `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACK` | leave blank, the defaults in `ml/app/config.py` apply |

The ML service doesn't connect to Postgres or Redis. Express owns all persistence.

### 4. Start everything

```bash
pnpm run dev:all
```

This starts the ML service, waits for it to be healthy, then starts the dashboard and API.

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| GraphQL API | http://localhost:4000/graphql |
| ML service docs | http://localhost:8000/docs |

The first run downloads the Sentence-BERT model (about 90 MB), so the ML service takes a
while to come up. If it fails to start, check `ml/.dev-server.log`.

To run the pieces separately, use `pnpm dev` for web and server, and
`python -m uvicorn app.main:app --reload --port 8000` from `ml/` (venv active) for the ML service.

### 5. Signing in

Sign-in is real Google OAuth through Supabase. While the Google consent screen is in Testing
mode, only accounts added as Test users in Google Cloud Console can sign in. **Ask Dre to add
your Google account** before you try.

## Things worth knowing

- **Shared data.** Everyone's local server points at the same Supabase database and Upstash Redis.
  Test data, ingests and cached scores are visible to the whole team. For isolation, run
  `docker compose up -d` and point your own `DATABASE_URL` and `REDIS_URL` at `localhost`.
- **No NCF weights?** `ml/weights/ncf.pt` is gitignored and downloaded on first boot when the
  Supabase values are set in `ml/.env`. Without it the collaborative score is a neutral 0.5,
  which is the documented cold-start behavior, not a bug.
- **Rules.** Soft deletes only, no `any` or `console.log`, and ask before schema migrations or
  auth changes. Run `pnpm type-check` and `pnpm lint` before pushing.

## More docs

| File | Covers |
|---|---|
| `COMMANDS.md` | Day-to-day commands |
| `ONBOARDING.md` | Guided walkthrough for new teammates |
| `ARCHITECTURE.md` | How the services fit together |
| `DEPLOYMENT.md` | Hosted setup (Supabase, Upstash, Render, Vercel, ngrok) |
| `DATABASE.md` | Schema and data rules |
