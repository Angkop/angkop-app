---
description: TypeScript conventions, code style, and constant organization
---

# Coding Style

## TypeScript
- No `any` types — use proper types, generics, or `unknown` with type guards
- No `console.log` — use the pino logger (`src/lib/logger.ts`) in the server; CI rejects these
- Import types from `@angkop/shared` before defining a new type locally — don't duplicate
- Prefer `type` over `interface` for plain data shapes; use `interface` only when extending

## Formatting (Prettier)
- No semicolons
- Single quotes
- 100 chars line width
- No trailing commas
- LF line endings

## Constants
- `UPPER_SNAKE_CASE` for all constants
- One constant or related group per file
- Shared constants go in `packages/shared/src/constants/`
- App-level constants go in the nearest `constants/` folder to where they're used

## Backend (Express API)
- Service classes use constructor injection (prisma, redis, logger) and a single `execute()` method
- Check for an existing service before creating new logic
- All DB queries must include `deleted: false` filter — soft deletes only, never hard delete

## Frontend (Next.js)
- Pages are thin — they just render the corresponding module (e.g. `<DashboardPage />`)
- All page logic lives in `modules/<page-name>/`
- Shared UI components go in `components/`
- No inline styles — Tailwind classes only
