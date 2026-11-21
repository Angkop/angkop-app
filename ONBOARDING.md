# Angkop — New Teammate Onboarding

> **For Claude:** A new teammate is joining the Angkop project. Guide them step by step through this file. Always ask before running any command. Wait for them to confirm each step is done before moving to the next one.

---

## About This Project

Angkop is a hybrid job matching and career recommendation system for Filipino job seekers. It uses Sentence-BERT for semantic skill matching and Neural Collaborative Filtering for personalized recommendations.

The codebase is a **pnpm + Turborepo monorepo** with four main parts:

| Folder | What it is |
|---|---|
| `apps/web` | Next.js 15 dashboard (user profile, job matches, skill gaps) |
| `apps/server` | Express + Apollo GraphQL API |
| `apps/extension` | Chrome browser extension (Manifest V3, Vanilla JS) |
| `ml/` | Python FastAPI ML microservice (Sentence-BERT + NCF) |
| `packages/shared` | Shared TypeScript types used across all JS services |

---

## Step 1 — Install Prerequisites

Work through each tool. Check the version after each install to confirm it worked.

### Node.js 22.x
- Download and install from nodejs.org (LTS version)
- Verify: `node -v` should show `v22.x.x`

### pnpm
- Install via: `npm i -g pnpm`
- Verify: `pnpm -v` should show `11.x.x` or higher

### pyenv + Python 3.12
The project uses Python 3.12 for the ML microservice. We use pyenv to manage Python versions without affecting your system Python.

1. Install Homebrew if you don't have it (macOS): check with `brew --version`
2. Install pyenv: `brew install pyenv`
3. Add pyenv to your shell (run all three lines):
   ```
   echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
   echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
   echo 'eval "$(pyenv init -)"' >> ~/.zshrc
   ```
4. Reload shell: `source ~/.zshrc`
5. Install Python 3.12: `pyenv install 3.12.0`
6. Verify: `python3 --version` should show `3.12.x`

> The `.python-version` file in the repo root automatically tells pyenv to use 3.12 when you're inside the project folder.

### Docker Desktop (optional)
- Download from docker.com and install
- Verify: `docker --version`
- Only needed for a fully-offline local Postgres + Redis (`docker-compose.yml`). The normal setup uses the shared cloud ones

### Git
- Verify: `git --version`
- Make sure you have access to the GitHub repo

---

## Step 2 — Clone the Repo

```
git clone <repo-url>
cd angkop-app
```

After cloning, confirm pyenv switched to 3.12 automatically:
```
python3 --version
```
Should show `3.12.x`.

---

## Step 3 — Install JS Dependencies

From the project root:
```
pnpm install
```

This installs dependencies for all apps and packages in one shot because of the pnpm workspace setup.

---

## Step 4 — Environment Variables

Each service needs a `.env` file. Values marked `ask Dre` are secrets for shared services — get them from Dre, don't create your own, and never commit them to git. The full table is in `README.md` under "Environment files".

**`apps/server/.env`**
```
DATABASE_URL=        # ask Dre
REDIS_URL=           # ask Dre
SUPABASE_URL=        # ask Dre
SUPABASE_SERVICE_KEY= # ask Dre
ML_SERVICE_URL=http://localhost:8000
WEB_URL=http://localhost:3000
PORT=4000
```

**`apps/web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=       # ask Dre
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # ask Dre
```

**`ml/.env`**
```
GEMINI_API_KEY=       # ask Dre (service won't start without one; a dummy value boots it)
SUPABASE_URL=         # ask Dre (downloads the NCF weights on first boot)
SUPABASE_SERVICE_KEY= # ask Dre
YOUTUBE_API_KEY=      # optional, ask Dre
```

Sign-in is Google OAuth, and only accounts added as Test users in Google Cloud Console can use it. Ask Dre to add yours.

---

## Step 5 — Verify Everything Runs

First set up the ML virtualenv once:
```
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

Then, with env vars set, start everything from the root:
```
pnpm run dev:all
```

This starts the ML service, then the Next.js dashboard and Express API via Turborepo. To run only the JS services, use `pnpm dev` and start the ML service yourself (below).

Check:
- Dashboard → `http://localhost:3000`
- GraphQL API → `http://localhost:4000/graphql`

To run the ML microservice on its own (separate terminal):
```
cd ml
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

Check:
- ML service Swagger → `http://localhost:8000/docs`

---

## Key Rules for This Codebase

- **Soft deletes only** — never call `prisma.*.delete()`. Set `deleted: true` instead.
- **No `console.log`** — use the pino logger (`src/lib/logger.ts`) in the server.
- **No `any` in TypeScript** — CI will reject it.
- Use types from `@angkop/shared` — don't redefine types that already exist there.
- Ask before running schema migrations or changing auth/permissions.

---

## Useful Files to Read

| File | What it covers |
|---|---|
| `CLAUDE.md` | Full project context, architecture, and codebase rules |
| `TECHSTACK.md` | Every technology used and why |
| `SETUP.md` | Detailed setup checklist with all config steps |
