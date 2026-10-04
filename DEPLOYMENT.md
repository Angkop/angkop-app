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

## Phase 3 — Render: Express API (`apps/server`)

- [ ] Create Render account, connect GitHub repo
- [ ] New Web Service, root directory `apps/server`
- [ ] Build command: `cd ../.. && pnpm install && pnpm --filter @angkop/server build`
- [ ] Start command: `pnpm --filter @angkop/server start`
- [ ] Env vars set in Render dashboard: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
      `REDIS_URL`, `JWT_SECRET`, `ML_SERVICE_URL` (filled in after Phase 4), `WEB_URL` (filled
      in after Phase 5)
- [ ] First deploy succeeds, `/graphql` reachable at the Render URL

---

## Phase 4 — Render: ML Microservice (`ml/`)

- [ ] New Web Service, root directory `ml`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Env vars: `DATABASE_URL`, `REDIS_URL`, `MODEL_NAME`, `NCF_WEIGHTS_PATH`,
      `NCF_ID_MAPPING_PATH`
- [ ] Resolve `ml/weights/ncf.pt` delivery — it's gitignored (correctly, per
      `data-safety.md`: no model weights in git), so the deployed instance needs another way
      to get it (upload to Supabase Storage / GitHub Release + fetch-on-boot). **Needs a small
      code change before this phase can finish — flag to Claude when ready.**
- [ ] First deploy succeeds, `/health` returns `{"status": "ok"}` without OOM
      (512MB free-tier RAM is tight for Torch + Sentence-Transformers — watch the boot logs)

---

## Phase 5 — Vercel: Web Dashboard (`apps/web`)

- [ ] Import repo into Vercel, root directory `apps/web`
- [ ] Env vars: `NEXT_PUBLIC_API_URL` (Render API URL from Phase 3),
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] First deploy succeeds, dashboard loads at the Vercel URL

---

## Phase 6 — Wire services together

- [ ] Set `apps/server`'s `WEB_URL` (Render) to the real Vercel domain
- [ ] Set `apps/server`'s `ML_SERVICE_URL` (Render) to the real ML service Render domain
- [ ] Tighten `cors()` in `apps/server/src/index.ts` to `cors({ origin: process.env.WEB_URL })`
      instead of wide-open — **small code change, flag to Claude when ready**

---

## Phase 7 — Google Cloud Console

- [ ] OAuth client for Google sign-in (Supabase Auth → Providers → Google), redirect URI from
      Supabase pasted into Google Cloud's authorized redirect URIs
- [ ] Separate incremental-consent OAuth config for `gmail.send` scope (must stay separate from
      basic sign-in scope, per `CLAUDE.md`)
- [ ] Gemini API key obtained, added to whichever service calls the Application Draft
      Generator

---

## Phase 8 — Browser Extension

- [ ] Local defense demo: `chrome://extensions` → Developer mode → Load unpacked
      (`apps/extension`) — no hosting needed
- [ ] (Optional) Chrome Web Store listing, $5 one-time dev fee — only if needed beyond the
      thesis defense
