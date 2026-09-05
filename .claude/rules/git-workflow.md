---
description: Branching, commit format, and PR conventions
---

# Git Workflow

## Branches
- `main` — single source of truth, all work merges here
- Feature branches: `feat/<short-description>` (e.g. `feat/match-score-overlay`)
- Bug fix branches: `fix/<short-description>` (e.g. `fix/ncf-cold-start`)
- Chore branches: `chore/<short-description>` (e.g. `chore/update-deps`)

## Commit Format
```
type: short description
```
Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`

Examples:
- `feat: add semantic match score to extension overlay`
- `fix: skill gap vector subtraction off-by-one`
- `chore: update prisma schema for interaction weights`

## Before Pushing
- Run `pnpm type-check` — no TypeScript errors
- Run `pnpm lint` — no ESLint errors
- No `console.log` or `any` left in changed files

## PRs
- Target `main` for all features and fixes
- Title matches commit format
- Never force push to `main`
