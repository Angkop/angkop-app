# Angkop — Deployment Plan

Tracks getting Angkop's services onto free-tier cloud hosting. Update the checkboxes as each
phase completes. See `CLAUDE.md` and `.claude/rules/data-safety.md` for the rules this plan
follows (no `prisma migrate deploy` run by Claude, no hard deletes, etc.).

Stack: Supabase (DB) → Upstash (Redis) → Render (Express API + FastAPI ML service) → Vercel
(Next.js dashboard) → Google Cloud (OAuth + Gmail + Gemini).

---

## Phase 1 — Supabase (Database) ✅ DONE (fully complete)

- [x] Org + project created
- [x] Database password set (contains `#`, percent-encoded as `%23` in `DATABASE_URL`)
- [x] `DATABASE_URL` filled into `apps/server/.env`
- [x] `SUPABASE_URL` filled into `apps/server/.env`
- [x] `SUPABASE_SERVICE_KEY` filled into `apps/server/.env` (using the new **secret** key)
- [x] `NEXT_PUBLIC_SUPABASE_URL` filled into `apps/web/.env.local`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` filled into `apps/web/.env.local` (using the new
      **publishable** key)
- [x] pgvector extension enabled
- [x] `DATABASE_URL` added to `ml/.env` (same value as server, same `%23` encoding)
- [ ] `prisma migrate deploy` run against this DB — **run by the user, not Claude**, once the
      schema is final and we're ready to go live (not before)

---

## Phase 2 — Upstash (Redis) ✅ DONE

- [x] Create free Redis database at upstash.com (Singapore region, matches Supabase)
- [x] Copy the `rediss://` TLS connection string
- [x] Fill `REDIS_URL` into `apps/server/.env` (replacing the local `redis://localhost:6379`)
- [x] Fill `REDIS_URL` into `ml/.env`

---

## Phase 3 — Render: Express API (`apps/server`) ✅ DONE

- [x] Create Render account, connect GitHub repo
- [x] New Web Service, root directory left blank (monorepo root), region Singapore
- [x] Build command: `pnpm install && pnpm --filter @angkop/server build`
- [x] Start command: `pnpm --filter @angkop/server start`
- [x] Env vars set in Render dashboard: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
      `REDIS_URL`, `JWT_SECRET` (real generated secret, not the local dev one),
      `ML_SERVICE_URL`/`WEB_URL` set as placeholders, to be updated after Phases 4 and 5
- [x] First deploy succeeds
- [x] Fixed along the way (committed to repo, not just Render config):
  - `apps/server/package.json` — added `"postinstall": "prisma generate"` (Render's fresh
    install never generated the Prisma client, causing `job is of type 'unknown'` TS errors)
  - `apps/server/package.json` — fixed `start` script from `node dist/index.js` to
    `node dist/src/index.js` (tsc's `rootDir: "."` nests output under `dist/src/`, bug existed
    before this deploy but was never exercised since local dev uses `tsx` directly)

---

## Phase 4 — ML Microservice (`ml/`) ✅ DONE (local + ngrok tunnel, not cloud-hosted)

Free-tier cloud hosting didn't pan out for this one — tried in order:
- Render free Web Service: OOM-killed on boot (512MB ceiling, Torch + Sentence-Transformers
  need more)
- Hugging Face Spaces: Docker/Gradio SDKs (anything that runs compute) now require a PRO
  subscription — only Static Spaces are free, which can't run a FastAPI backend
- Fly.io: no free tier at all for new accounts as of 2026 (legacy free allowances only)

Landed on: run it locally, expose it with an ngrok tunnel so the Render-hosted
`apps/server` can reach it.

- [x] `ml/app/services/weights_fetcher.py` added — fetches `ncf.pt` + `id_mappings.json`
      from Supabase Storage (`ml-weights` bucket) if not already on disk. Not strictly needed
      for the local setup (files are already on disk locally), but keeps the retrain workflow
      (Colab → upload to bucket → restart) intact if this ever moves to real cloud hosting
- [x] `ml/Dockerfile` + Space metadata in `ml/README.md` committed but unused for now —
      left in place in case HF PRO or another host becomes viable later
- [x] ngrok account created, static free domain claimed:
      `refining-domestic-cough.ngrok-free.dev`
- [x] Local `uvicorn` + `ngrok http --url=...` running concurrently
- [x] Render's `apps/server` → `ML_SERVICE_URL` updated to the ngrok domain
- [x] `apps/server/.env` (local) left as `http://localhost:8000` — no tunnel needed when
      both services run on the same machine
- [x] Verified `https://refining-domestic-cough.ngrok-free.dev/health` responds `{"status":"ok"}`
- [ ] The unused `angkop-ml` Render service — suspend or delete, your call

**Known limitation, not a blocker right now**: this only works while your laptop, `uvicorn`,
and `ngrok` are all running simultaneously. Fine for dev/demo use. Revisit before the
40-respondent evaluation phase — local+tunnel won't survive that unattended (options then:
pay for Render/HF, or a Google Cloud Run free-tier attempt, which looked genuinely viable
from research but wasn't pursued here).

---

## Phase 5 — Vercel: Web Dashboard (`apps/web`) ✅ DONE

- [x] Import repo into Vercel, root directory `apps/web`
- [x] Env vars: `NEXT_PUBLIC_API_URL` (Render API URL from Phase 3),
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] First deploy succeeds, dashboard loads at `https://angkop-app.vercel.app/`

---

## Phase 6 — Wire services together ✅ DONE

- [x] Set `apps/server`'s `WEB_URL` (Render) to `https://angkop-app.vercel.app`
- [x] `ML_SERVICE_URL` already pointed at the ngrok domain back in Phase 4
- [x] Tightened `cors()` in `apps/server/src/index.ts` to `cors({ origin: process.env.WEB_URL })`
      — committed and pushed (`fix cors`)

---

## Phase 7 — Google Cloud Console

- [x] OAuth client for Google sign-in created, redirect URI set to Supabase's callback
- [x] Supabase → Authentication → Providers → Google enabled with that client's ID/secret
- [x] Redirect URLs registered (`/onboarding` for both local and the deployed Vercel domain)
- [ ] **Needs re-registering**: the OAuth redirect target moved from `/onboarding` to
      `/auth/callback` (which now checks for an existing profile and routes to
      `/dashboard` or `/onboarding` accordingly, instead of always landing on
      `/onboarding`) — add `/auth/callback` to Supabase's Redirect URLs allow-list for
      both local and the deployed Vercel domain
- [x] Real Google sign-in replacing dev-login — built and working (see git history: "feat:
      replace dev-login with real Google OAuth via Supabase Auth")
- [x] Found + closed a critical gap along the way: RLS was disabled on all 9 Supabase tables,
      meaning the public anon key could read/write everything directly via PostgREST,
      bypassing the Express API entirely. Fixed with `ALTER TABLE ... ENABLE ROW LEVEL
      SECURITY` on every table, no policies needed since Express/Prisma uses the
      RLS-bypassing `service_role` key.
- [ ] Separate incremental-consent OAuth config for `gmail.send` scope — explicitly deferred,
      out of scope for now (see git history for the scoping decision)
- [ ] Gemini API key + Application Draft Generator — explicitly deferred, out of scope for now

---

## Phase 8 — Browser Extension (on hold, come back later)

- [ ] Local defense demo: `chrome://extensions` → Developer mode → Load unpacked
      (`apps/extension`) — no hosting needed
- [ ] (Optional) Chrome Web Store listing, $5 one-time dev fee — only if needed beyond the
      thesis defense
- [ ] Note for whenever this resumes: `apps/extension/manifest.json` and `content.js` are
      still hardcoded to `http://localhost:4000` — will need pointing at the real Render API
      (and the extension's own auth story, Chrome Identity API, is still unbuilt — see the
      "explicitly out of scope" note in the Google OAuth plan)
