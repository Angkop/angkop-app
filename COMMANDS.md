# Commands

All commands run from the **project root** unless noted.

## Docker (optional — fully-offline local Postgres + Redis)

```bash
docker compose up -d    # start local Postgres + Redis containers
docker compose down     # stop them (data persists in the named volume)
```

Not used by `dev:all` — `apps/server/.env` and `ml/.env` point `DATABASE_URL`/`REDIS_URL` at
the cloud Supabase/Upstash instances instead (see `DEPLOYMENT.md`), so this is only useful if
you deliberately want a fully-offline local DB (you'd need to repoint those env vars at
`localhost` yourself).

## Development

```bash
pnpm dev          # start all JS services (web + server) in parallel
pnpm run dev:all  # one command: ML service + web + server (against cloud Postgres/Redis)
```

> Signing in now requires a real Google account — the old instant dev-login stub was
> removed in favor of real Google OAuth via Supabase Auth. While the Google OAuth consent
> screen is in "Testing" mode, only accounts added as **Test users** in Google Cloud
> Console can sign in (see `DEPLOYMENT.md` Phase 7). Local sign-in works the same way as
> production — `http://localhost:3000/onboarding` is registered as a redirect URL for it.

## ML Microservice (`ml/`)

Setup (one-time):
```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run locally (separate terminal, inside `ml/`, venv active) — this is what `dev:all` also
runs internally:
```bash
uvicorn app.main:app --reload --reload-dir app --port 8000
```
Confirm it's up at http://localhost:8000/docs.

Expose it for the deployed `apps/server` on Render to reach (not needed for pure local dev —
only when the Render-hosted API needs to call your local ML service, see `DEPLOYMENT.md`
Phase 4). Needs two terminals running at once, alongside the `uvicorn` one above:
```bash
ngrok http --url=https://<your-static-domain>.ngrok-free.dev 8000
```
Then set `ML_SERVICE_URL` in Render's `apps/server` environment to that same
`https://<your-static-domain>.ngrok-free.dev` URL. Both `uvicorn` and `ngrok` must stay
running for Render to reach it — if either stops, calls from the deployed API will fail.

## Build

```bash
pnpm build        # build all apps
```

## Lint

```bash
pnpm lint         # lint all apps
```

## Type Check

```bash
pnpm type-check   # TypeScript check across all apps
```

## Database (run inside `apps/server`)

> Claude can edit `prisma/schema.prisma` and run `db:generate`, but cannot run push, pull, or migrate commands — you must run those yourself.

```bash
npx prisma generate     # regenerate Prisma client after schema changes (also runs automatically on `pnpm install` via postinstall)
npx prisma studio       # open Prisma Studio to browse data
```

## Real listings (run inside `apps/server`, after migrating + seeding)

```bash
pnpm run ingest:jobs    # pull real postings from RemoteOK/Arbeitnow into Postgres
```

Browse them at http://localhost:3000/listings — same pages the browser extension scrapes.

Run manually only — requires team agreement before executing:
```bash
npx prisma db push      # apply local schema to the database (dev only)
npx prisma db pull      # sync schema.prisma from the actual database
npx prisma migrate reset    # ⚠️  wipes and recreates the entire database
npx prisma migrate deploy   # ⚠️  runs pending migrations against the real DB
```

## URLs (local)

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Real listings (extension demo target) | http://localhost:3000/listings |
| GraphQL API | http://localhost:4000/graphql |
| ML Service | http://localhost:8000/docs |

## URLs (deployed)

See `DEPLOYMENT.md` for the full setup history and rationale behind this split.

| Service | URL | Notes |
|---|---|---|
| Dashboard | https://angkop-app.vercel.app | Vercel |
| GraphQL API | https://angkop-server.onrender.com/graphql | Render |
| ML Service | (local machine, via ngrok tunnel) | No free-tier cloud host could run Torch + Sentence-Transformers — runs on a laptop with `uvicorn` + `ngrok` both kept running, see `DEPLOYMENT.md` Phase 4. Only reachable while that laptop is on. |
| Database | Supabase (pooler connection) | — |
| Redis | Upstash | — |

.