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

```bash
pnpm db:generate  # regenerate Prisma client after schema changes
pnpm db:push      # apply schema to Supabase (dev only)
pnpm db:studio    # open Prisma Studio to browse data
```

## URLs (local)

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| GraphQL API | http://localhost:4000/graphql |
| ML Service | http://localhost:8000/docs |
