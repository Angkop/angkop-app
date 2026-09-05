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

### Docker Desktop
- Download from docker.com and install
- Verify: `docker --version`
- Used for running the ML microservice locally in a container

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

Each service needs a `.env` file. Ask a teammate for the values — never commit these to git.

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

## Step 5 — Verify Everything Runs

Once env vars are set, run all JS services from the root:
```
pnpm dev
```

This starts the Next.js dashboard and Express API in parallel via Turborepo.

Check:
- Dashboard → `http://localhost:3000`
- GraphQL API → `http://localhost:4000/graphql`

For the ML microservice (separate terminal):
```
cd ml
python3 -m uvicorn app.main:app --reload
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
