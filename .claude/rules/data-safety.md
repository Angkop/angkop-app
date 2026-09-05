---
description: Data safety rules — soft deletes, query filters, and sensitive operations
---

# Data Safety

## Soft Deletes
- Every model has a `deleted Boolean @default(false)` field
- Never call `prisma.*.delete()` or `prisma.*.deleteMany()` — set `deleted: true` instead
- Every query must include `deleted: false` in its `where` clause — no exceptions

## Query Rules
- Always scope queries to the authenticated user: filter by `userId` on every user-owned record
- Never return raw embeddings (Float[]) to the client — these are internal only

## Sensitive Operations
- Schema migrations require a team decision before running — never run `prisma migrate` unilaterally
- `prisma db push` and `prisma db pull` are blocked in Claude — run manually only when the team agrees
- Auth and permission changes require explicit approval before implementing
- One-off data fixes must use a script with a `DRY_RUN` guard before doing real writes

## Environment
- Never commit `.env` files — all secrets go in `.env.example` with empty values as documentation
- ML model weights (`*.pt`, `*.bin`) are never committed — store separately
