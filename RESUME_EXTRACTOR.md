# Resume Extractor — How It Works

Upload a resume (PDF or DOCX) from the Profile page or Onboarding, get back
structured profile fields (skills, experience, education, etc.) pulled out by
Gemini, review what was found, and only on explicit **Import** does any of it
land in the profile form — nothing is saved until the normal Save/Finish flow
runs. See `ARCHITECTURE.md` for how the three services fit together generally;
this doc is specifically about this one feature's request path.

---

## Entry points

- **Profile page** — "Import resume" button in `ProfileHeader`
  (`apps/web/modules/profile-page/components/profile-header.tsx`), visible in
  both readonly and edit state. Importing switches the page into edit mode
  with fields filled in but unsaved.
- **Onboarding** — "Import from resume" button in `AboutStep`
  (`apps/web/modules/onboarding-page/components/about-step.tsx`).

Both render the same `ResumeImportDialog`
(`apps/web/components/resume-import-dialog.tsx`), which is the one place this
flow's UI lives — upload → parsing → review → Cancel/Import.

---

## Request flow

```
Browser (ResumeImportDialog)
  -> POST /api/resume/parse  (multipart, field "resume", Bearer token)
       |
       v
Express (apps/server/src/routes/resume.ts)
  1. multer: memory storage, 10MB cap, mimetype allow-list (PDF/DOCX)
  2. magic-byte check (detectResumeFileKind) - the declared mimetype is
     client-controlled, the file's actual bytes are not
  3. extractResumeText() - pdf-parse or mammoth, then normalize
     (NFKC, collapsed whitespace, trimmed) - throws a friendly error for
     scanned/image-only PDFs (<200 chars extracted) or password-protected PDFs
  4. hashResumeText() - sha256 of the lowercased normalized text
  5. Redis cache check: resume:cache:<userId>:<hash>
       HIT  -> return cached result immediately, zero Gemini calls,
               X-Resume-Parse-Source: cache
       MISS -> continue
  6. checkQuota(userId) - circuit breaker, then per-user cooldown/daily/
     weekly, then global daily cap (see Quota layer below)
       BLOCKED -> 429 or 503, no Gemini call, nothing recorded against the
                  user's own quota (a blocked request never consumed it)
  7. extractContactFields() - regex email/phone/LinkedIn/GitHub locally
  8. recordUserParse(userId) - now committed to an actual Gemini call
  9. callMlWithRetry() -> FastAPI, up to 2 retries (backoff + jitter) on
     429/5xx
       |
       v
FastAPI (ml/app/routers/resume.py -> ml/app/services/resume_parser.py)
  - Gemini call: temperature 0, capped max_output_tokens, response_schema
    enforced JSON, thinking disabled where the model supports it
  - Validates + clamps every enum-shaped field (careerLevel, employmentType,
    skillLevel, languageProficiency) against the real allowed values -
    model output never reaches a typed field unvalidated
       |
       v
Express (continued)
  10. success -> recordGeminiSuccess() (resets the breaker's failure streak)
      failure -> recordGeminiFailure() (may open the breaker), 503 to client
  11. merge: regex email/phone/links override the model's guess when found
      (regex is the source of truth for these - the model is told not to
      guess them at all)
  12. cache the merged result (resume:cache:<userId>:<hash>, long TTL)
  13. respond with the parsed JSON, X-Resume-Parse-Source: gemini
       |
       v
Browser: review screen shows what was found: Cancel discards it, Import
fills the profile editor's in-memory form state (useProfileEditor.
importParsedResume) - still requires the existing Save / Finish step to
actually persist anything.
```

---

## Quota layer (Redis-backed, no DB involved)

Everything lives in `apps/server/src/lib/resume-quota.ts`, using the same
`ioredis` client already wired up in `lib/redis.ts` for match-score caching —
no Prisma schema changes were needed for any of this.

| Key pattern | Purpose | Reset |
|---|---|---|
| `resume:cache:<userId>:<hash>` | cached parse result | `RESUME_CACHE_TTL_DAYS` |
| `resume:cooldown:<userId>` | blocks back-to-back uploads | `RESUME_USER_COOLDOWN_SECONDS` |
| `resume:daily:<userId>:<Pacific date>` | per-user daily new-parse count | ~26h |
| `resume:weekly:<userId>:<week bucket>` | per-user weekly new-parse count | ~8 days |
| `resume:global-daily:<Pacific date>` | global daily new-parse count | ~26h |
| `resume:breaker:fail-count` | consecutive Gemini failures | 10 min of quiet |
| `resume:breaker:open-until` | circuit breaker pause | `RESUME_BREAKER_PAUSE_MINUTES` |

The daily counter uses the Pacific calendar date because that's when Gemini's
free-tier quota resets. The weekly counter is a coarse 7-day bucket, not a
true ISO week — good enough for a soft cap.

Only a request that actually reaches step 9 above (a real Gemini call) counts
against a user's daily/weekly allowance — a cache hit or a request blocked
earlier costs nothing.

---

## What never got built (and why)

The original spec this was built from assumed a Postgres-first design: a
`resume_versions` table, full version history with a "make active" UI, manual
edits stored separately, and a queued-request worker for over-quota uploads.
None of that exists here on purpose — this repo already had Redis wired up
for exactly this kind of ephemeral state, so caching/quota/circuit-breaking
could all ship without a migration. If real version history (multiple saved
resumes per user, switch-active, edit history) is wanted later, that's a
genuine schema addition and needs its own migration-file-only plan per
`.claude/rules/data-safety.md` — it hasn't been designed.

Also out of scope: legacy `.doc` (binary, pre-2007 format — `mammoth` only
reads `.docx`), scanned-PDF-as-image fallback (currently just a friendly
"looks scanned" error instead of sending the image to Gemini), and an
automated test suite (`apps/server` has no test runner configured yet).

---

## Config

All in `apps/server/.env` / `.env.example` (none secret):

```
RESUME_GLOBAL_DAILY_SOFT_CAP=800
RESUME_MAX_NEW_PARSES_PER_USER_PER_DAY=10
RESUME_MAX_NEW_PARSES_PER_USER_PER_WEEK=30
RESUME_USER_COOLDOWN_SECONDS=30
RESUME_BREAKER_PAUSE_MINUTES=5
RESUME_CACHE_TTL_DAYS=90
```

And in `ml/.env` / `.env.example`:

```
GEMINI_API_KEY=       # real key only in the local, gitignored .env
GEMINI_MODEL=gemini-3.5-flash-lite
```

`GEMINI_API_KEY` only ever exists in `ml/.env` — Express never sees it, it
just calls the FastAPI service over `ML_SERVICE_URL`.

---

## Notes for whoever touches this next

- **Model names expire.** `gemini-2.0-flash` (this feature's original default)
  was deprecated mid-session; the API's own error message pointed at a
  replacement. `gemini-3.8-flash` worked but spent ~45 "thinking" tokens on
  a one-word test prompt and hit sustained demand-overload 503s during
  testing. `gemini-3.5-flash-lite` (current default) has no thinking
  overhead and no `thinking_config` support at all — passing one is a 400,
  which is why `resume_parser.py` only sets it when `"lite" not in
  GEMINI_MODEL`. Check `client.models.list()` against the live API before
  assuming any model name here still exists.
- The circuit breaker is what actually protects against a model that starts
  returning sustained 5xx (which happened live during this feature's own
  development, not a hypothetical) — don't remove it to "simplify" retries.
- `apps/server`'s multer `fileFilter` only checks the browser-reported
  mimetype; `detectResumeFileKind` (magic bytes) is the real gate. Don't
  trust the mimetype alone if this gets touched again.
