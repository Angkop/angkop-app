# Plan: Optimize codebase performance (audit 2, 2026-11-21)

> Goal: make the dashboard and feed load faster without changing any score, ranking or result a user sees. Based on a read-only audit of `apps/server`, `ml/`, `apps/web` and `apps/extension` against the performance checklist (async flow, loops, Prisma queries, indexes, caching, bundle, React). Checklist sections that don't apply here (money math, PWA/offline, tRPC, Zustand, tenant `companyId` scoping) are skipped.

## Rules for this plan

- Nothing is written until the user approves a phase. The user commits their own work.
- Schema edits go in `apps/server/prisma/schema.prisma` only. The developer runs the migration. Claude never runs `prisma migrate`, `db push` or `migrate reset`.
- Soft deletes stay. No `prisma.*.delete` or `deleteMany` is introduced. Every touched query keeps `deleted: false` and its `userId` scope.
- No `any`, `console.log`, `as any` or `@ts-ignore`. Raw embeddings never go to the client.
- Behavior parity: same scores (float tolerance), same order, same lists as today.
- Measure first (Phase 0). A fix without a before/after number is dropped.

## Performance rules for code written under this plan

- `Promise.all()` for independent async operations. No sequential await chains.
- `Map` / `Set` for O(1) lookups. No `array.find` or `includes` inside loops.
- `for-of` with early `continue`. No `filter`-`map` chains on large collections.
- `useMemo` for expensive derived state. Not `useEffect` plus `setState` to keep two states in sync.
- `useCallback` for handlers passed to child components.
- Lazy state init: `useState(() => expensive())`, not `useState(expensive())`.

(Two rules from the source list were left out on purpose: direct file imports over barrel files, and `lazy(withChunkRecovery(...))`. Angkop's only barrels are server and shared entry points, and `withChunkRecovery` does not exist here; lazy loading uses `next/dynamic`, as `app-shell.tsx` already does.)

## Baseline: BEFORE (measured 2026-11-21)

Scripts live in the session scratchpad (`measure-baseline.js`, `measure-cold-feed.js`), read-only, saving `baseline-<label>.json` and `cold-feed-<label>.json` so every phase can be diffed. Re-run with a new label after each phase. Timings were taken from a laptop, so every DB/Redis number includes a WAN round trip (the DB executes the catalog query in about 2 ms, the other ~190 ms is network). Treat them as upper bounds, and compare before/after from the same machine.

| Measure | Before |
|---|---|
| Scale today | 2,145 live jobs (2,651 total), 3 users, 27 interactions, 4 saved jobs, 1 user at 10+ interactions |
| Redis today | 6 keys total, 0 `match-score:*` keys (cache empty or expired) |
| One `invalidateMatchScoresForUser` | 1 SCAN command, 34 ms. It scales with total keys in Redis, not this user's keys |
| Catalog query (id, title, company, skills) | 255 ms median |
| Same jobs with embeddings | 1,724 ms median (about 17 MB over the wire) |
| Cold feed to ML (`/recommend/batch`, all 2,145 jobs) | 17.12 MB request body, 170 ms ML time on loopback |
| `/api/jobs/skills` query | 229 ms median |
| `/api/jobs?skill=` page 1 | 192 ms median |
| Seq scans on `Job` (listings, skill filter) | 1.7-2.0 ms execution at 2,145 rows |
| Web first-load JS | `/` (login) 315 kB, `/onboarding` 315 kB, `/auth/callback` 241 kB, `/applications` 190 kB, `/matches` 189 kB, `/listings` 178 kB, `/dashboard` 141 kB, `/skill-gaps` 141 kB |

What this changes:
- **Indexes (Phase 3) and select trimming (Phase 2) are not worth doing at today's scale.** Sequential scans take about 2 ms at 2k rows, and `include: { job: true }` only hits a handful of saved jobs per request. Revisit if jobs grow roughly 10x or more (ingest adds up to 50 a day).
- **The score cache (Phase 1) is the thing that breaks first as users grow.** Keys are one per (user, job), so 1,000 users who each load the feed is about 2 million keys. One SCAN sweep at COUNT 500 is then thousands of commands per click, and each command costs a network round trip.
- **The login page (`/`) is 2.2x the dashboard's first-load JS**, which fits the static three.js import.

## Already done (verified in code, do not redo)

| Item | Where |
|---|---|
| Indexes on `Interaction`, `SavedJob`, `SkillGapRecord`, `Job`, plus trigram on title/company | `schema.prisma:249-309, 368` |
| Batched `MGET`, single-flight, pipelined `SET`, `SCAN` instead of `KEYS` | `lib/redis.ts` |
| Stored embeddings reused, one `/recommend/batch` per cache miss, batched NCF forward pass | `helpers.ts:158`, `recommendations.py` |
| Saved and dismissed jobs excluded before scoring; only the page's rows hydrated | `helpers.ts:194-286` |
| `skillGaps` cached, `createMany` + `@@unique`, per-process user upsert set | `queries.ts`, `index.ts` |
| Server-side pagination on `savedJobs`; targeted Apollo updates instead of refetch | `queries.ts:186`, `applications-page.tsx` |
| Lazy `ProfileSheet` and dialogs; `BrandLoader` imports three.js on demand | `app-shell.tsx`, `brand-loader.tsx` |
| Gemini client singleton with timeout; bounded YouTube cache; extension scrapers and `console.log` gone | `ml/app/services`, `apps/extension` |

## Findings still open (ranked by impact)

### Phase 0: Measure baseline (DONE, see the table above and the scratchpad scripts)
- Count `Job` rows and `User` rows, and time `jobMatches` cold vs warm. These set the scale for every phase below.
- `EXPLAIN ANALYZE` on: `/api/jobs` with a `skill` filter, `/api/jobs/skills`, `computeScoredJobs`' catalog query, the nightly stale-check `savedJob where jobId in (...)`.
- Add `@next/bundle-analyzer` (dev dependency, `ANALYZE=true next build`) and record first-load JS for `/` (login), `/dashboard`, `/listings`.
- Check Upstash's command count for one feed load plus one save, since SCAN loops count per command.
- **Verify:** numbers written into this file under each phase.

### Phase 1: Cache the score ingredients, blend with the live interaction count (DONE 2026-11-21)
- **What changed:** the cache now holds `{ semanticScore, collaborativeScore }` per (user, job) in one Redis hash per user (`match-scores:<userId>`), not the blended score. `scoreJobs` blends on every read from the user's current interaction count (`blendHybridScore` in `@angkop/shared`, same formula as `ml/app/routers/recommendations.py`). So view, save and dismiss no longer invalidate anything; only a profile edit does (one `DEL`). The ingest's keyspace SCAN for removed jobs is gone (their fields just expire). The count is fetched in parallel with queries the callers already run, so a warm feed pays no extra round trip.
- **This replaced** the earlier "skip invalidation after 10 interactions" idea. Caching ingredients helps users under 10 interactions too, which is most of the evaluation's first-time users.
- **Files:** `lib/redis.ts`, `graphql/resolvers/helpers.ts` + `queries.ts` + `mutations.ts`, `routes/events.ts` + `match-score.ts`, `scripts/ingest/ingest-jobs-service.ts`, `scripts/reset-all-data.ts`, `packages/shared/src/index.ts`, new `lib/match-blend.test.ts`; docs `ARCHITECTURE.md`, `ALGORITHM.md`.
- **Checks:** `pnpm type-check` and `pnpm lint` pass; 14 server tests pass, including one that fails if the weight constants in `@angkop/shared` and `ml/app/config.py` drift apart. `EXPIRE ... NX` confirmed to work on the Upstash instance.
- **Parity:** 2,138 of 2,138 job scores bit-identical to before, same order (largest difference 0).

| Benchmark (local Redis, real DB reads, local ML) | Before | After |
|---|---|---|
| Feed right after a click | 2,276 ms, 2,149 Redis commands | **227 ms, 3 commands** |
| Warm feed, nothing changed | 246 ms, 1 command | 285 ms, 3 commands (within run-to-run noise; 3 = the 2,138 ids sent as three HMGET chunks) |
| Cold feed (cache empty) | 2,552 ms, 2,139 commands | 2,870 ms, 7 commands (the ML and Postgres cost is unchanged; the run-to-run spread was larger than this gap) |
| Wiping one user's cache, 40 users cached | 85,520 keys in Redis, 342 commands, 58.6 ms | **40 keys, 1 command, 0.4 ms** |

Redis was local, so the times above exclude network. On a remote Redis, every command is a round trip, so the command counts are the number to read: 2,149 round trips after a click became 3, and a 342-command wipe became 1.

- **Behavior changes to know about:** (1) the first feed load per user after deploy is cold once (old keys expire within 24h and are never read again). (2) The 24h lifetime is now per user hash, started by its first write, instead of per key. (3) A model retrain does not invalidate on its own. Flush `match-scores:*` (or `reset-all-data`) after deploying new weights, same as the 24h wait before.
- **Not done in this phase:** the cold feed itself (read ~17 MB of embeddings, send to ML). It now only happens on first visit or a profile edit. See Phase 1b.


### Phase 1b: Make the cold feed cheap (not started, needs approval)
- **Evidence:** a cold feed still costs ~2.5-2.9 s locally: about 17 MB of job embeddings read from Postgres, then sent to the ML service for 170 ms of math. After Phase 1 it only happens on a user's first visit, a profile edit, or when their hash expires.
- **Change:** keep job embeddings in Node's memory (refreshed after the nightly ingest or on a timer) and compute the semantic score in Node (one dot product per job, since embeddings are already normalized). The ML service is then only needed for the collaborative score, which today is a constant 0.5 for every real user and job.
- **Cost:** moves the cosine math out of Python, so a parity test against the ML service's output is required. Do this only if the measured cold feed on the deployed app is still too slow after Phase 1.
- **Optional later:** a nightly scheduler that pre-fills scores for recently active users, and only once the model is retrained on real interactions.

### Phase 2: Trim payloads and selects (DONE 2026-11-21)
- `include: { job: true }` became an explicit select without `embedding` (`SAVED_JOB_JOB_SELECT` in `resolvers/constants.ts`) at the five saved-job mutations and the `savedJobs` page; `skillGaps` now selects only `id` and `requiredSkills`. The GraphQL `Job` type never exposed the embedding, so this only removes wasted database transfer.
- **Measured:** 4 saved jobs (today): 183 ms to 184 ms (no change), 39 kB to 6 kB. A full 50-job page: 244 ms to 184 ms, 476 kB to 71 kB.

### Phase 3: Indexes (SKIPPED, not worth it at this size)
- Sequential scans take about 2 ms at 2,145 jobs. Revisit if the catalog grows about 10x (ingest adds up to 50 a day). The candidates stay listed in the Findings above: GIN on `requiredSkills`, `[platform, deleted, createdAt]`, `SavedJob.jobId`, the `userProfileId` foreign keys.

### Phase 4: `jobMatches` shape (DONE 2026-11-21, smaller than planned)
- **Measured first:** a warm feed was about 264 ms: about 186 ms is the database round trip from a laptop, about 43 ms was transferring and parsing the 2,145-row catalog, and all in-process work (blend, sort, filters) was 0.5 ms. So the planned single-pass filter cleanup would save about half a millisecond and was **not done**. Vectorizing the ML cosine would save about 14 ms of a ~2.8 s cold feed and could break bit-identical scores, so it was **not done** either.
- **Done:** the job catalog (id, title, company, skills) is reused in memory for 60 seconds (`lib/job-catalog.ts`, built on `lib/ttl-cache.ts`, concurrent callers share one load) instead of being re-read on every page, search and filter change. A removed job can linger for up to 60 s; the page's rows are loaded fresh with `deleted: false`, so it is dropped from the page rather than shown.
- **Measured:** warm feed 285 ms to 200 ms; feed after a click 227 ms to 204 ms. The rest is the database round trip. Scores: 2,138 of 2,138 still bit-identical to the original baseline, same order.

### Phase 5: Public listings endpoints (DONE 2026-11-21)
- `/api/jobs/skills` is `SELECT DISTINCT unnest(...)` in Postgres, and both `/sources` and `/skills` are held in memory for 5 minutes. `getListings` uses `revalidate: 60` instead of `no-store`.
- **Measured (local API + production web build):** `/api/jobs/skills` 244 ms to 2 ms; `/api/jobs/sources` 198 ms to 1 ms; `/listings` page 210 ms to 9 ms. Those are cache hits; a cache miss costs what it did before (the skills query alone: 212 ms to 205 ms, 99.7 kB to 39.1 kB from the database). Output lists are byte-identical to before.
- **Behavior to know:** a new ingest can take up to 5 minutes (filter options) or 60 seconds (listing pages) to show up.

### Phase 6: Web bundle (DONE 2026-11-21)
- The login hero (`CapybaraStage`) loads its three.js scene with `next/dynamic` (`ssr: false`) behind a placeholder that holds the same 3:2 box. **Measured (`next build`):** `/` first-load JS 315 kB to 184 kB (-131 kB, -42%). Other routes unchanged. Not checked in a browser: open `/` and confirm the capybara still appears.
- `/onboarding` (315 kB) and `/auth/callback` (241 kB) were inspected and left alone: onboarding's weight is zod plus the form libraries for the wizard, and the callback's is the shared base plus Supabase and Apollo. `moment-timezone` only ships inside already-lazy chunks, so it was not replaced.
- Apollo query batching stays rejected: `jobMatches` is the slow query and a batch would hold the fast ones until it finishes.

### Phase 7: Resilience (DONE 2026-11-21, compression not done)
- Every ML call now has a deadline (`lib/ml-client.ts`): 30 s for the math routes, 100 s for the Gemini-backed insight and resume routes (the ML service's own Gemini calls time out at 30 s and 45 s and retry once). A timeout is thrown as a 504 `MlServiceError`, which the existing retry and circuit-breaker logic already treats as transient. Test: a stand-in server that never answers fails at the deadline instead of hanging.
- **Not done:** `compression` middleware. It needs the deployed API's URL to check whether Render already compresses responses (`curl -H 'Accept-Encoding: gzip' -I <api>/api/jobs/skills`, look for `content-encoding`).

### Phase 8: Low priority, only if Phase 0 says so
- Ingest embeds one listing at a time. The ML service serializes inference behind a lock anyway, so batching `/embed` calls is the only possible gain, and it runs nightly off the user path.
- Extension: add a session cache so repeat views of one listing don't refetch the score or re-log a `view`. The extension is on hold (`DEPLOYMENT.md` Phase 8).

## Open questions for the user

1. Roughly how many `Job` and `User` rows are in Supabase now, and how many do we expect for the 40-respondent evaluation? This decides whether Phases 3 and 4 are worth doing.
2. Approve the Redis key-format change in Phase 1 (one cold cache after deploy)?
3. Remaining: Phase 1b (cheap cold feed) and Phase 8, both optional, and the compression check in Phase 7. Phase 3 only if the catalog grows about 10x.
