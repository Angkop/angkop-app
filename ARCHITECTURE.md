# Angkop MVP — Technical Architecture

How the local MVP actually works: what each service does, how Docker/Redis/Postgres fit
together, and the request flow end to end. Written against what's actually implemented
(Epics 1–6 of `SETUP.md`) — see `TECHSTACK.md` for the full planned stack and versions,
and `CLAUDE.md` for the overall project/thesis context.

---

## Services at a glance

```
apps/web        Next.js dashboard              :3000
apps/server     Express + Apollo GraphQL API   :4000
ml/             FastAPI ML microservice        :8000
apps/extension  Manifest V3 browser extension  (runs in Chrome, not a server)
packages/shared TypeScript types shared by web + server (not a running service)

docker compose  Postgres (db)                  :5432
                Redis (redis)                  :6379
```

One command starts all of it: `pnpm run dev:all` (`scripts/dev.sh`) — brings up Docker,
waits for Postgres/Redis to be ready, starts the ML service and waits for its health
check, then runs `turbo dev` for web + server. See that script for the exact sequencing.

---

## Where Docker fits in

Docker only runs the two **stateful** pieces: Postgres and Redis (`docker-compose.yml`,
root of the repo). Everything else (Next.js, Express, FastAPI) runs directly on the host
via `pnpm`/`uvicorn` — no Dockerfiles for those in this MVP, since the whole point was to
run locally without needing a Supabase account or any cloud provisioning.

- **`db` (postgres:16)** — plain Postgres, not Supabase. `SETUP.md`'s original plan
  assumed Supabase-hosted Postgres + pgvector; this MVP swaps that for a disposable local
  container so nothing requires an external account. Data persists in the named volume
  `angkop_db_data` across `docker compose down` / `up` (but not across `down -v`).
- **`redis` (redis:7)** — plain Redis, matches the original plan exactly (`SETUP.md` §11
  just said "run locally via Docker").

Nothing in `ml/` talks to Docker directly — see "Why the ML service doesn't touch
Postgres/Redis" below.

---

## Where Redis fits in

Redis has exactly one job: caching computed match scores, per the thesis's documented
24h-TTL design.

`apps/server/src/lib/redis.ts`:
- `getOrSetMatchScore(userId, jobId, compute)` — key `match-score:{userId}:{jobId}`,
  `EX 86400` (24h). Cache hit returns instantly; cache miss calls `compute()` (which hits
  the ML service's `/recommend`) and stores the result.
- `invalidateMatchScoresForUser(userId)` — deletes every `match-score:{userId}:*` key.
  Called from three places whenever something that affects a user's scores changes:
  - `updateProfile` GraphQL mutation (skills/skillsText feed the semantic score)
  - `logInteraction` GraphQL mutation (interaction count feeds the hybrid blend weight)
  - `POST /api/events` REST route (same reason — this is the extension's path, separate
    from the dashboard's GraphQL path)

Without that invalidation, a profile edit or a Save/Dismiss click wouldn't be reflected
in scores for up to 24h — this was a real bug found and fixed mid-session (see the git
history / conversation for context), not part of the original design.

---

## Where Postgres/Prisma fits in

Postgres is the single source of truth for everything structured: `User`, `UserProfile`,
`Job`, `Interaction`, `SkillGapRecord`, `SavedJob`, `SavedCourse`
(`apps/server/prisma/schema.prisma`). All soft delete (`deleted Boolean @default(false)`),
all queries filtered on it — no hard deletes. `SavedJob` carries the `ApplicationStatus`
enum (`PENDING` → `APPLIED` → `AWAITING_INTERVIEW` → `ONGOING_INTERVIEW` → `INTERVIEWED` →
`SUCCESSFUL`/`UNSUCCESSFUL`) plus free-text `tags` and an optional `interviewDate` — this
is Epic 8's data model, drafted but **not yet migrated** (see `SETUP.md`/commit history for
the manual `prisma migrate` step).

Prisma is only ever driven from `apps/server` — the ML service has no database client at
all (see below). `apps/server/prisma/seed.ts` loads the fixtures in `seed/*.json`
(`users.json`, `jobs.json`, `interactions.json`) — the **single source of truth** for
demo data, shared with the NCF training script (same fixed ids like `demo-user-1`,
`job-1` so Postgres and the trained model agree on who's who).

---

## The ML microservice (FastAPI) — and why it's stateless

`ml/app/main.py` mounts three routers, all pure computation, no persistence:

| Endpoint | What it does |
|---|---|
| `POST /embed` | Real Sentence-BERT (`all-MiniLM-L6-v2`) embedding, 384-dim |
| `POST /recommend` | Hybrid match score (see below) |
| `POST /skill-gap` | Per-skill cosine similarity gap detection |

**Deliberate simplification:** the ML service never talks to Postgres or Redis directly,
even though `SETUP.md`'s `.env` template implies it might (`DATABASE_URL`, `REDIS_URL`
were in the original plan). Express owns all persistence and passes whatever text/ids the
ML service needs straight in the request body. This keeps exactly one database client in
the whole system (Prisma, in `apps/server`) instead of two that could drift out of sync.

### Hybrid scoring (`app/routers/recommendations.py`)

```
semantic_score      = cosine_similarity(embed(user_skills_text), embed(job_text))
collaborative_score = NCF(user_idx, job_idx)   — or 0.5 (neutral) if either id
                                                  is unseen (cold start)
collaborative_weight = min(0.1 + 0.05 × interaction_count, 0.6)
hybrid_score         = collaborative_weight × collaborative_score
                        + (1 − collaborative_weight) × semantic_score
```

This is a real implementation of the thesis's stated design: collaborative signal gains
influence as a user accumulates interaction history; a brand-new user/job pair falls back
to a neutral score instead of a fabricated confident one.

### The NCF model (`app/models/ncf.py`, `scripts/train_ncf.py`)

A small, genuinely-trained NeuMF (GMF + MLP, per He et al. 2017) — embedding dim 8, MLP
`[16, 8]`. `scripts/train_ncf.py` trains it on `seed/interactions.json` (positive
interactions + random negative sampling, ~300 epochs, seconds on CPU) and writes
`ml/weights/ncf.pt` + `ml/weights/id_mappings.json` (which user/job ids the model knows).
This mirrors the thesis's documented workflow — "trained offline, weights deployed to
FastAPI" — just with a tiny local training script standing in for Google Colab.

### Skill-gap detection — a deliberate deviation from the literal pseudocode

The thesis's Chapter 3 pseudocode says: `gap_vector = job_embedding - user_embedding`,
then take the top-k dimensions and map them to skill labels. That's not implemented
literally, because raw dimension-subtraction isn't meaningful for a generic, unlabeled
384-dim Sentence-BERT space — the axes aren't interpretable as specific skills.

What `app/routers/skill_gap.py` actually does: embed each of the job's `requiredSkills`
and each of the user's declared `skills` individually, then for each required skill take
its max cosine similarity against any user skill. Below a threshold (0.5), it's a gap.
This is still a genuine vector-based comparison (satisfies the thesis's own definition of
that term) — it just produces sensible, checkable output instead of noise.

### Concurrency — a real bug that was fixed

Two issues surfaced while load-testing this locally, both now fixed in
`app/services/embedder.py` / `app/services/ncf_service.py`:

1. **Thread oversubscription**: FastAPI runs sync route handlers in a thread pool
   (~40 concurrent). PyTorch's CPU ops are *also* internally multi-threaded by default.
   Ten concurrent `/recommend` calls (one dashboard load = one call per job) meant dozens
   of OS threads all fighting over the same CPU cores — severely enough that the process
   stopped responding to anything, including `/health`. Fixed with
   `torch.set_num_threads(1)` plus a lock serializing actual model calls.
2. **No warm-up**: the Sentence-BERT model loaded lazily on the first real request, so
   the first batch of concurrent requests landed mid-load. Fixed with a `startup` event
   that embeds one throwaway string at boot.

On the Express side, `apps/server/src/lib/concurrency.ts` (`mapWithConcurrency`) caps how
many `/recommend` calls fire at once (3) instead of firing all of a user's jobs
simultaneously — a second layer of protection against the same problem.

---

## Express API (`apps/server`)

- **Auth**: `POST /auth/dev-login` issues a JWT (via `jose`) for the seeded demo user —
  no Google OAuth/Supabase, by design, so the MVP runs without external accounts. Real
  Google OAuth 2.0 via Supabase Auth is still the documented production plan
  (`CLAUDE.md`); this is explicitly a stand-in, flagged with a `// SAFE:` comment in
  `src/routes/auth.ts`.
- **GraphQL** (`/graphql`, requires `Authorization: Bearer <token>`): `me`, `jobMatches`,
  `skillGaps`, `savedJobs`, `savedCourses` queries; `updateProfile`, `logInteraction`,
  `saveJob`, `unsaveJob`, `updateSavedJobStatus`, `setSavedJobInterviewDate`,
  `addSavedJobTag`, `removeSavedJobTag`, `saveCourse`, `unsaveCourse` mutations. This is
  what the dashboard talks to. `saveJob` both upserts the `SavedJob` row and records the
  same `Interaction('save')` event `logInteraction` would, so the NCF signal isn't lost —
  only the dashboard's Save button goes through it, though; the extension's Save (via
  `POST /api/events` below) still only logs an `Interaction`, not a `SavedJob`.
- **REST**: `POST /api/events` (interaction logging — used by the extension, which isn't
  behind the dashboard's JWT flow) and `GET /api/match-score/:jobId` (single-job score
  lookup, also for the extension's overlay).
- **CORS**: permissive (`cors()`, no origin restriction) — a deliberate MVP simplification
  so `/api/events` can accept requests from whatever origin a job platform's content
  script runs on, not just the dashboard. Flagged as needing lockdown before any real
  deployment.

---

## Web dashboard (`apps/web`)

Next.js App Router, `modules/<page>/` pattern per `.claude/rules/coding-style.md`. Apollo
Client (`lib/apollo-client.ts`) attaches the JWT from `localStorage` to every GraphQL
request via a `setContext` auth link. Match score display follows
`.claude/rules/design.md`: always a %, always paired with a label, green/yellow/red at
70%/40% thresholds (`packages/shared`'s `getMatchLabel`).

Pages: `/dashboard` (job matches), `/skill-gaps`, `/applications` (Epic 8 — saved jobs
with status/tags/interview date, backed by the `savedJobs` query above), `/profile`.
Profile's onboarding-derived fields (location, education, experience, certifications,
projects, languages, preferences, resume filename) are real, migrated `UserProfile`
columns/relations (`apps/server/prisma/schema.prisma`), not mock data — same as
`SavedJob`/`SavedCourse`. The Profile page also supports importing a resume (PDF/DOCX)
to prefill these fields via Gemini — see `RESUME_EXTRACTOR.md` for that flow.

`public/demo/job-listing.html` is a static fixture bundled into the app specifically so
the extension has something to scrape that's guaranteed to work, independent of whether
JobStreet/LinkedIn/Indeed's real DOM structure matches the extension's best-effort
selectors.

---

## Browser extension (`apps/extension`)

Manifest V3, vanilla JS, no build step. `src/content/content.js` detects which platform
it's on by hostname and scrapes accordingly (the demo page's scraper is exact/reliable;
JobStreet/LinkedIn/Indeed selectors are best-effort and unverified against live sites).
On load it: logs a `view` interaction → fetches that job's match score →
`src/overlay/overlay.js` renders the floating badge with Save/Dismiss buttons, which log
further interactions on click. The background service worker
(`src/background/service-worker.js`) is currently minimal — content scripts talk to the
Express API directly rather than relaying through it.

---

## Real listings pipeline — sourcing job data without a ToS problem

The demo page (`public/demo/job-listing.html`) proves the extension *can* scrape reliably,
but it's one static fixture with hand-written text. Scraping the real JobStreet/LinkedIn/
Indeed DOM to get real data would mean depending on selectors that can change without
notice and, more importantly, operating against those platforms' own Terms of Service —
which generally prohibit automated scraping outright. Directly calling a job-board API
from Express would avoid the ToS problem but would stop demonstrating the actual thing the
extension is supposed to do (read a job listing page in the browser).

The middle path implemented here: ingest real listings from public job-board APIs into our
own Postgres, then **re-serve them on our own site** (`apps/web/app/listings/[jobId]`) for
the extension to scrape. Scraping content you serve yourself carries no third-party ToS
risk at all — the only remaining obligation is the source API's own terms, which for these
two is just "link back to the original posting," satisfied via the `sourceUrl` shown on
each listing page.

- `apps/server/src/scripts/ingest-jobs.ts` (`pnpm --filter @angkop/server run ingest:jobs`)
  — pulls up to 50 listings each (~100 total) from RemoteOK (`remoteok.com/api`, no auth) and
  Arbeitnow (`arbeitnow.com/api/job-board-api`, no auth), strips HTML from descriptions, computes a
  real embedding per listing via the ML service, and upserts them as `Job` rows with
  `platform: 'demo'` (this is still the "we control this page" tier — CLAUDE.md's 6
  supported platforms are unchanged) plus `sourceName`/`sourceUrl` for attribution. Safe to
  re-run — upserts on a deterministic id (`angkop-remoteok-<id>`, `angkop-arbeitnow-<slug>`).
- `GET /api/jobs`, `GET /api/jobs/:id` (`apps/server/src/routes/jobs.ts`) — unauthenticated
  on purpose, only return jobs with `sourceName` set (real ingested listings, not the
  seeded/hand-written demo jobs), since these back a public-facing page rather than the
  authenticated dashboard.
- `/listings` and `/listings/[jobId]` (`apps/web/modules/listings-page`,
  `listing-detail-page`) — server-rendered, so the full HTML (including the
  `data-angkop-platform`/`.job-title`/`.job-company`/`.job-description`/`.job-skill`
  scraper contract shared with the static demo page) is present without waiting on
  client-side JS.
- `apps/extension/manifest.json` matches `http://localhost:3000/listings/*` in addition to
  `/demo/*` — `content.js` needed no change since it already routes any `localhost` host to
  the same reliable scraper.

---

## End-to-end request flow (dashboard job feed)

```
Browser (dashboard)
  → GraphQL query jobMatches (JWT in header)
    → Express: fetch jobs + profile + interaction count from Postgres (Prisma)
    → for each job (max 3 concurrent):
        → Redis: cache hit? return cached score
        → cache miss:
            → ML /recommend (userSkillsText, jobText, interactionCount)
                → embed both texts (Sentence-BERT, serialized)
                → NCF lookup (or 0.5 if unseen)
                → blend into hybrid_score
            → Redis: cache result, 24h TTL
    → sort by hybrid_score, return to dashboard
  → render color-coded % + label per job
```

---

## Known simplifications (intentional, not oversights)

- Dev-only auth instead of Google OAuth/Supabase
- ML service has no direct DB/Redis access (stateless, Express-mediated)
- Skill-gap uses per-skill cosine similarity instead of literal embedding-dimension
  subtraction
- Epic 8 (saved jobs/status/tags/interview date/saved courses) is drafted — schema,
  GraphQL, resolvers, and the `/applications` page all exist — but the Prisma migration
  hasn't been run yet, and only the dashboard's Save button is wired to it; the browser
  extension's Save still only logs an `Interaction`, not a `SavedJob`
- Gemini cover letters / Gmail send (Epic 7) — out of scope, not started
- Permissive CORS
- Extension's real-platform selectors are unverified (no live browser testing available
  while building)

All flagged inline in code comments at the relevant file, not just here.
