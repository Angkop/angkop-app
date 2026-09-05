# Commands

All commands run from the **project root** unless noted.

## Development

```bash
pnpm dev          # start all JS services (web + server) in parallel
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
| GraphQL API | http://localhost:4000/graphql |
| ML Service | http://localhost:8000/docs |
