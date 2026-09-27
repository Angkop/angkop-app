# Commands

All commands run from the **project root** unless noted.

## Docker (Postgres + Redis)

```bash
docker compose up -d    # start local Postgres + Redis containers
docker compose down     # stop them (data persists in the named volume)
```

`pnpm run dev:all` runs this automatically — only needed standalone if you're not using that.

## Development

```bash
pnpm dev          # start all JS services (web + server) in parallel
pnpm run dev:all  # one command: docker + ML service + web + server
```

For the ML microservice (separate terminal, inside `ml/`):
```bash
uvicorn app.main:app --reload
```

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
pnpm db:generate        # regenerate Prisma client after schema changes
pnpm db:studio          # open Prisma Studio to browse data
```

## Real listings (run inside `apps/server`, after `db push` + `seed`)

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
