# Plan: Optimize codebase performance

> Goal: reduce time complexity and redundant work in the hottest paths (match scoring, saved jobs, job matches browse) and cut unnecessary client-side loading weight, across apps/server, ml/, apps/web, and apps/extension — with no change to the scores, rankings, or data users see.

## Durable decisions

- **Scope**: performance and loading time only. No new features, no auth/permission changes, no UI redesign. Where a fix requires a schema change, it's additive only (new `@@index`, one new `@@unique`) — never a column/model redesign.
- **Schema migrations**: Claude only edits `apps/server/prisma/schema.prisma`. The developer runs `prisma migrate dev`/`deploy` manually — Claude never runs `migrate`, `db push`, or `migrate reset`.
- **Soft deletes preserved**: every touched query keeps `deleted: false`; no `prisma.*.delete`/`deleteMany` is introduced anywhere in this plan, including the cache-invalidation and SkillGapRecord cleanup work.
- **No `any` / `console.log` / `as any` / `@ts-ignore`**: every touched file stays CI-clean, including removing the existing `console.log` in `apps/extension/src/background/service-worker.js`.
- **One-off backfill = `/script-maker`**: backfilling `UserProfile.embedding` for existing users is a data fix, not inline code. It's produced via `/script-maker` with a `DRY_RUN` guard — never hand-written.
- **Cross-service contract**: `/recommend`'s request/response shape is shared by `apps/server` (`ml-client.ts`, `@angkop/shared` types) and `ml/app/routers/recommendations.py`. Both sides change together, in the same phase, with a text fallback so a profile that hasn't been backfilled yet still works (just slower) instead of breaking.
- **Caching invariants preserved**: Redis TTL stays 24h; the cache key format (`match-score:<userId>:<jobId>`) is unchanged so a mid-rollout deploy doesn't orphan cached entries.
- **Behavior parity**: every phase must produce the same results as today for the same inputs (same job order, same scores within float tolerance, same saved-job list) — this is a performance initiative, not a scoring-algorithm change.

## Architecture

### System breakdown — the match-scoring hot path (the one true cross-layer change, Phase 4)

```
Today — every jobMatches / savedJobs call, for every job in the result:
  Job.embedding        (stored at ingest, read, then ignored)
  UserProfile.embedding (hardcoded to [] on every save — never populated)
                          │
                          ▼
  recommend({ userSkillsText, jobText })  ──►  embed_text(user) + embed_text(job)   [global inference lock]
                          │                              │
                          ▼                              ▼
                    predict_collaborative_score     cosine_similarity
                          │                              │
                          └──────────────► hybridScore ◄─┘

  N jobs in a feed load = N re-embeds of the SAME user skills text, plus N re-embeds
  of job text that was already embedded once, at ingest time.

After:
  Profile save  ──► embed(skillsText) once ──► UserProfile.embedding populated
  Job ingest    ──► (already does this)   ──► Job.embedding populated
                          │
                          ▼
  recommend({ userEmbedding, jobEmbedding })  ──►  cosine_similarity directly
                          │                              (no re-embed — falls back to
                          ▼                               text only if either vector
                    predict_collaborative_score            is still missing)
                          │
                          └──────────────► hybridScore

  Sentence-BERT now only runs at ingest (already happens) and at profile save
  (already infrequent) — never inside the per-job scoring loop.
```

### Tradeoffs

- **Precomputed embeddings over live re-embed per request**: removes the dominant cost in the hot path (N redundant Sentence-BERT calls per feed load) at the cost of a one-time backfill plus re-embedding on each profile save (already rare).
- **`/recommend` accepts embeddings with text as a fallback, not a hard replacement**: lets the endpoint change and the backfill land in the same phase without a flag day — profiles not yet backfilled keep working, just slower, until the backfill script runs. Removing the fallback entirely is a follow-up once backfill is confirmed complete, not part of this plan.
- **Cosine similarity stays computed in the ML service, not Node**: this phase changes *what* is sent to `/recommend`, not *where* scoring logic lives — keeps the scoring formula and weighting constants in one place, avoiding two mechanisms drifting apart.
- **No migration to a native pgvector `vector` column / ANN index**: the embedding columns are only ever read by the ML service today, never queried directly in SQL. A pgvector migration is a real schema change with its own risk and is out of scope — flagged as future work only if direct SQL similarity search is ever needed.
- **Single-flight + batched Redis reads over per-job `get`/`set`**: cuts N round trips to ~1-2 and stops two concurrent requests from both paying for the same ML call on a cache miss.
- **In-memory "seen user" set over a DB read before every upsert**: the GraphQL context currently writes to `User` on every single request; skipping repeat upserts per process is simpler than adding a read-then-write, and a process restart just re-upserts once more — harmless.

### Integration points

- **Reuses**: the existing `/embed` endpoint and `embed()` client (already used by job ingestion) — no new ML endpoint needed, just a new optional field on `/recommend`'s request. Existing `{items, total}` pagination shape already used by `jobMatches` and `skillGaps` — `savedJobs` adopts the same shape instead of inventing a new one.
- **Extends**: `RecommendRequest`/`RecommendResponse` types in `@angkop/shared`, `computeJobMatches`/`computeHybridScoresByJobId` in `helpers.ts`, the profile-save mutation(s), the `savedJobs` resolver and GraphQL schema.
- **Deliberately untouched**: NCF collaborative scoring internals (`predict_collaborative_score`), the skill-gap analyzer's algorithm, Gemini draft generation content, the `MatchInsight` caching model, all auth/permission logic.

> Rule: no code for the next phase until the user explicitly approves the current one. The user commits their own work — do not commit.

---

## Phase 1: Database indexes
**Goal**: queries filtered by `userId`, `jobId`, `deleted`, `eventType`, or `status` use an index instead of a sequential scan as data grows.

### What to build
Add to `apps/server/prisma/schema.prisma` (additive only, no column changes):
- `Interaction`: `@@index([userId, deleted, eventType])`, `@@index([jobId, deleted])`
- `SavedJob`: `@@index([userId, deleted])`
- `SkillGapRecord`: `@@index([userId, jobId, deleted])`
- `Job`: `@@index([deleted, platform])`, `@@index([deleted, sourceName])`

`MatchInsight` and `JobDescriptionSection` already have `@@unique` constraints that cover their lookup patterns (`userId_jobId`, `jobId_order`) — no new index needed there.

### Verify
- [ ] `npx prisma validate --schema=apps/server/prisma/schema.prisma` passes
- [ ] `npx prisma generate` passes
- [ ] `pnpm type-check` passes
- [ ] Developer runs the migration on dev (not run by Claude)

### Gate
Do NOT write Phase 2 code until the user explicitly approves this phase and the migration is on dev.

---

## Phase 2: Redis batching, stampede guard, SCAN-based invalidation
**Goal**: match-score cache reads are batched instead of one round trip per job, two concurrent requests can't both pay for the same cache-miss compute, and invalidation stops using the blocking `KEYS` command.

### What to build
- `apps/server/src/lib/redis.ts`: add a batched getter that does one `mget` across all `(userId, jobId)` keys for a set of jobs, then only calls `compute()` for the misses, writing results back with a pipelined `set`.
- Add an in-process single-flight map keyed by `` `${userId}:${jobId}` `` so concurrent requests for the same uncached pair share one in-flight ML call instead of issuing two.
- Replace `invalidateMatchScoresForUser`'s `redis.keys(...)` (`lib/redis.ts:33`) with a `SCAN`-based cursor loop.
- Update `computeJobMatches`/`computeHybridScoresByJobId` in `helpers.ts` to call the new batched getter instead of invoking `getOrSetMatchScore` once per job inside `mapWithConcurrency`.

### Verify
- [ ] `pnpm type-check`, `pnpm lint`
- [ ] Manual: call `jobMatches` twice in a row for the same user — second call shows zero ML service calls in server logs (full cache hit) and one batched Redis read instead of N
- [ ] Manual: run Redis `MONITOR` while triggering `invalidateMatchScoresForUser` (e.g. via a profile edit) — confirm `SCAN` appears, `KEYS` does not

### Gate
Do NOT write Phase 3 code until the user explicitly approves this phase.

---

## Phase 3: Server hygiene bundle
**Goal**: remove avoidable per-request DB writes and duplicate inserts unrelated to embeddings.

### What to build
- `apps/server/src/index.ts`: track already-upserted user ids in an in-process `Set<string>` so `prisma.user.upsert` (currently run on every GraphQL request, `index.ts:47-51`) only fires the first time a given user is seen per process.
- `apps/server/src/graphql/resolvers/queries.ts` (`skillGaps`, `:117-130`): replace the per-skill `Promise.all(... prisma.skillGapRecord.create ...)` loop with `prisma.skillGapRecord.createMany({ data: [...], skipDuplicates: true })`. Add `@@unique([userId, jobId, skill])` to `SkillGapRecord` in `schema.prisma` (same migration rule as Phase 1 — developer runs it).
- `apps/server/src/routes/events.ts`: run the independent `prisma.user.findFirst` and `prisma.job.upsert` calls in parallel via `Promise.all` (verify they're actually independent before changing).
- `apps/server/src/graphql/resolvers/helpers.ts`: extract the shared body of `computeJobMatches` (`:143-180`) and `computeHybridScoresByJobId` (`:185-208`) into one `scoreJobs(userId, jobs)` helper; both call it with their respective job list.

### Verify
- [ ] `pnpm type-check`, `pnpm lint`
- [ ] Manual: sign in twice in a row — confirm only one `User` upsert fires (check server logs or `updatedAt`)
- [ ] Manual: query `skillGaps` twice for the same saved job — confirm no duplicate `SkillGapRecord` rows
- [ ] Developer runs the `SkillGapRecord` migration

### Gate
Do NOT write Phase 4 code until the user explicitly approves this phase and the migration is on dev.

---

## Phase 4: Stored-embedding reuse (server + ML)
**Goal**: match scoring reuses the embeddings already stored on `Job` and `UserProfile` instead of re-running Sentence-BERT on every job in every feed load. This is the architecture change described above.

### What to build
- `packages/shared`: extend `RecommendRequest` with optional `userEmbedding?: number[]` and `jobEmbedding?: number[]`, keeping `userSkillsText`/`jobText` as the fallback.
- `ml/app/routers/recommendations.py`: `/recommend` uses `request.userEmbedding`/`request.jobEmbedding` when both are present; falls back to `embed_text(...)` only when either is missing.
- Every mutation that sets `UserProfile.skillsText` (onboarding, profile edit, resume import — including the hardcoded `embedding: []` at `mutations.ts:61`): call `embed({ text: skillsText })` and store the result on `UserProfile.embedding` instead of `[]`.
- `apps/server/src/graphql/resolvers/helpers.ts` (`scoreJobs`, from Phase 3): pass `job.embedding` and `profile.embedding` to `recommend()` instead of raw text, whenever both are non-empty.
- Backfill: generate the one-off script that re-embeds every existing `UserProfile.skillsText` and writes `embedding` via `/script-maker`, wrapped in `DRY_RUN`. This plan does not hand-write that script.

### Verify
- [ ] `pnpm type-check`, `pnpm lint`
- [ ] Manual: `curl` `/recommend` once with `userEmbedding`/`jobEmbedding` and once with only text — both return matching scores for the same underlying content
- [ ] Manual: for a test user, confirm `jobMatches` scores are unchanged (float tolerance) before and after this phase
- [ ] Backfill script run in `DRY_RUN` first and reviewed, then run for real by the developer — not an automatic part of "done"

### Gate
Do NOT write Phase 5 code until the user explicitly approves this phase AND the backfill has run on dev.

---

## Phase 5: jobMatches query shape — filter before scoring
**Goal**: `jobMatches` only scores jobs that can appear in the filtered result, instead of scoring every ingested job and filtering the scored array afterward.

### What to build
- `computeJobMatches` (via `scoreJobs`) accepts the `search`/`skill` filter and applies it inside the `prisma.job.findMany` `where` clause, so filtering happens before scoring, not after.
- `apps/server/src/graphql/resolvers/queries.ts` (`jobMatches`, `:43-87`) passes `args.search`/`args.skill` down instead of filtering the already-scored `allMatches` array at `:68-76`.
- Hidden-job (saved/dismissed) filtering stays applied to the now-smaller scored set, same as today.

### Verify
- [ ] `pnpm type-check`
- [ ] Manual: compare `jobMatches(search: "react")` output before and after this phase — identical items and order
- [ ] Manual: confirm (via a temporary log line or counter) that a narrow search term scores far fewer jobs than before

### Gate
Do NOT write Phase 6 code until the user explicitly approves this phase.

---

## Phase 6: ML service cleanup
**Goal**: clean up the remaining FastAPI-side inefficiencies — mostly in the fallback path, since Phase 4 removes embedding recomputation from the common case.

### What to build
- `ml/app/routers/recommendations.py`: when falling back to text (no precomputed embeddings supplied), batch the user+job embed calls into one `embed_texts([...])` call under a single lock acquisition instead of two separate `embed_text()` calls.
- `ml/app/services/match_insight.py` and `ml/app/services/resume_parser.py`: move `genai.Client(api_key=GEMINI_API_KEY)` construction to a module-level singleton; pass an explicit request timeout to the Gemini call.
- `ml/app/data/course_index.py`: bound `_youtube_cache` with a max size instead of growing unbounded.

### Verify
- [ ] Existing ML tests (if any) pass
- [ ] Manual: `/recommend` fallback path (no embeddings supplied) still returns correct scores
- [ ] Manual: a slow/mocked Gemini response doesn't hang past the configured timeout

### Gate
Do NOT write Phase 7 code until the user explicitly approves this phase.

---

## Phase 7: Web — SavedJobs/Applications pagination + targeted mutations
**Goal**: the Applications page follows the same server-side pagination convention as `jobMatches`/`skillGaps`/listings, and single-row edits don't refetch the whole list.

### What to build
- GraphQL schema + `savedJobs` resolver (`queries.ts:149-160`, `schema.ts:220`): add `page`/`pageSize` args, return a `SavedJobPage { items, total }` type matching `JobMatchPage`'s shape. Keep a separate lightweight unfiltered count for `ApplicationStatsRow` if it needs totals across all statuses.
- `apps/web/modules/applications-page/queries.ts` (`SAVED_JOBS_QUERY`): take `page`/`pageSize` variables.
- `apps/web/modules/applications-page/applications-page.tsx`: replace the fetch-all-then-slice (`:42-47`) with the query's own paginated `items`/`total`. Replace every `await refetch()` after a mutation (`:56, 61, 66, 71, 77`) with the mutation's own cache `update` (or `optimisticResponse`) touching only the affected `SavedJob`.

### Verify
- [ ] `pnpm type-check`, `pnpm lint`
- [ ] Manual: Applications page with 2+ pages of saved jobs paginates correctly; changing a status/tag/interview date on one card does not trigger a full-list network refetch (check the Network tab)

### Gate
Do NOT write Phase 8 code until the user explicitly approves this phase.

---

## Phase 8: Web — bundle splitting + fetch hygiene
**Goal**: pages that don't touch the profile editor or on-demand dialogs don't pay for their JS, and the listings page doesn't double-fetch on mount.

### What to build
- `apps/web/components/app-shell.tsx` (`:12, 163`): dynamic-import `ProfilePage` via `next/dynamic(() => import(...), { ssr: false })` instead of a static import.
- Same treatment for `components/resume-import-dialog.tsx` and `modules/skill-gaps-page/components/course-detail-dialog.tsx` wherever they're statically imported into their parent pages.
- `apps/web/modules/listings-page/components/listings-browser.tsx` (`:32-49`): guard the mount-time `useEffect` so it doesn't refetch when the draft filters already equal the server-provided `initialPage`'s filters.
- `apps/web/lib/jobs-api.ts` (`:36, 42, 48`): change `getListingSources`/`getListingSkills` from `cache: 'no-store'` to `next: { revalidate: 300 }`.

### Verify
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm build`
- [ ] Manual: dashboard loads, Profile sheet still opens and works correctly
- [ ] Manual: listings page does not fire a duplicate network request on first load (Network tab)

### Gate
Do NOT write Phase 9 code until the user explicitly approves this phase.

---

## Phase 9: Extension — caching, timeouts, dead code
**Goal**: the content script doesn't refetch/re-log the same job repeatedly, fails gracefully on a slow API, and ships no dead scraper code.

### What to build
- `apps/extension/src/content/content.js`: add a session-scoped cache keyed by `(userId, jobId)` so a repeat view of the same listing in one session doesn't re-fetch the match score or re-log a `view` interaction.
- Wrap both `fetch()` calls (`:77-85, 87-91, 100-106`) with an `AbortController` timeout (e.g. 8s); show a fallback state in the overlay on timeout instead of hanging indefinitely.
- Delete `scrapeJobStreet`, `scrapeLinkedIn`, `scrapeIndeed` (`:22-75`) — dead code, unreachable per the manifest's match patterns, and contradicts the CLAUDE.md rule that the extension never scrapes third-party platforms.
- Remove the `console.log` in `apps/extension/src/background/service-worker.js:2`.

### Verify
- [ ] Manual: load the extension, visit the same Angkop listing twice — second view does not re-fetch the match score and does not log a duplicate `view` interaction
- [ ] Manual: block the API port and confirm the overlay shows a fallback instead of hanging

### Gate
Final phase — no further gate.
