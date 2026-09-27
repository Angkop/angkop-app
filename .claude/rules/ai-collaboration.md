---
description: Working safely with AI in this codebase — what to check, what to block, when to stop
---

# AI Collaboration

AI is great at producing plausible-looking code. In Angkop, "plausible-looking" is the failure mode — generated code often misses invariants that aren't in the types: soft-delete filters, user scoping, correct embedding dimensions, ML contract shapes. Treat AI output as a **draft from a junior dev who has never seen this codebase**.

## Hard rules — never accept AI output that does any of these

- `prisma.*.delete` or `prisma.*.deleteMany` — soft-delete only (`deleted: true`). Hard deletes bypass any future audit trail.
- Any query missing `deleted: false` — including on relation includes.
- Any query on user-owned data missing a `userId` scope.
- Raw embeddings (`Float[]`) returned to the client — internal only.
- `any`, `as any`, `// @ts-ignore`, `console.log` — CI will reject the PR.
- Redefining a type that already exists in `@angkop/shared`.
- Hardcoded Tailwind colors or hex values instead of CSS variable tokens.
- Sending email via the Gmail API without a prior, explicit user-approval step on the draft.

If you genuinely need one of the above, leave a `// SAFE: <reason>` comment so a reviewer can audit it deliberately.

## Before accepting a diff from AI

- **Read every line.** If you can't explain why each change is there, don't commit it.
- **Run `pnpm type-check` + `pnpm lint`.** AI confidently invents fields, imports, and function signatures.
- **Grep for the function/service name.** AI often duplicates services that already exist — check before creating new logic.
- **Check the diff for drift** — unrelated formatting, unrelated imports, unrelated files touched. Revert anything outside the task.

## When AI is the right tool

- Boilerplate that follows an existing pattern (a new resolver modeled after an adjacent one).
- Refactors with clear before/after — renames, extractions, type tightening.
- Investigative reading of unfamiliar code (ask it to explain, not to change).

## When AI is the wrong tool

- Schema migrations — design these yourself, get team agreement before running.
- Auth/permission changes — a missing auth check is a security hole, not a typo.
- One-off data fixes — use `/script-maker` which enforces a `DRY_RUN` guard. The danger pattern: AI generates a script with `deleteMany`, you run it once, no audit trail, no way back.

## DB command rules

Never run these without explicit team agreement:
- `prisma migrate reset` — drops and recreates the entire database
- `prisma migrate deploy` — runs pending migrations against the real DB
- `prisma db push` — only for dev; never against a shared or production database
- Raw `DELETE`, `DROP`, or `TRUNCATE` SQL — always use soft delete instead

## Use the safeguards already in place

- **`settings.json` deny list** — `rm -rf`, `sudo`, and dangerous DB commands are blocked before they run.
- **`block-dangerous-git.sh`** — force pushes and direct pushes to `main` are blocked automatically.
- **`.claude/rules/`** — always loaded. If you find yourself correcting AI on the same thing twice, add the correction here so the next session inherits it.

## Prompting tips

- Point Claude at the local `CLAUDE.md` and the nearest existing service before asking for new code.
- Ask for a plan before code on anything non-trivial.
- Stop and re-prompt the moment the diff drifts. Long sessions accumulate hallucinated context.
