---
name: create-ticket
description: Create tickets for the Angkop team as GitHub issues in Angkop/angkop-app and add them to the Angkop project board (https://github.com/users/Angkop/projects/1) with a Status and optional assignee. Use when asked to create, add, write or log a ticket, task or issue, to turn a list of to-dos into tickets, or to put something on the board.
---

# Create ticket

Tickets are **GitHub issues in `Angkop/angkop-app`**, added to the **Angkop project board** (user project number 1, owner `Angkop`). Not draft items, unless the user asks for drafts.

## Ticket format

Title: short, sentence case, no prefix, names the outcome ("Add insight popover with top 5 jobs from behavior").

Body has exactly two sections, each as bullet points:

```
## Problem
- What is wrong or missing, and who it affects.
- Any constraint or open decision (for example a scope change the team must agree on first).

## Verification
- Concrete, checkable steps that prove it is done.
```

Verification must be **detailed**: things a reviewer can actually check, not "works correctly". Include what applies from the list below.

- The specific behavior, with the states: loading (skeleton), empty, error and success.
- Data rules: queries keep `deleted: false` and the `userId` scope, nothing is hard deleted, no raw embeddings reach the client, lists are server-side paginated.
- UI rules: shadcn/ui and CSS variable tokens only, match score shows a percentage with the right color and a label, works on desktop and phone width.
- Safety: Gmail sending only after explicit approval and incremental `gmail.send` consent. Schema changes are prepared as a Prisma file and run manually by the team. Auth or permission changes are raised with the team first.
- For a decision-heavy ticket (scope change, infra, translations), start Verification with the decision step: who agrees, and where it is recorded.
- For performance work: record a before and after baseline.
- Last bullet for code tickets: `pnpm type-check` and `pnpm lint` pass.

## Workflow

1. **Read the request.** Group related items into one ticket when they are one piece of work (for example "compile time" and "performance"). Keep distinct features separate. For a long list, give a one-table summary of the grouping.
2. **Ask only when context is missing.** If you don't know what an item means, ask an open-ended, free-text question about it before creating anything. Don't guess scope. If the user says to just create them, create them with reasonable defaults and say which details were your guess.
3. **Check for an existing ticket.** `gh issue list --repo Angkop/angkop-app --search "<keywords>" --state all`. Don't duplicate one.
4. **Create, add to the board, set Status, set assignee.** Use the commands below. Default Status is **Ready** unless the user names another column. Leave the assignee empty unless the user names one.
5. **Verify and report.** List the issue numbers, links, status and assignees as read back from the board, not from what you sent.

## Auth

The token needs the `project` scope to write to the board (`read:project` only reads). Check with `gh auth status`. If it is missing, ask the user to run it themselves, since it opens a browser:

```
! gh auth refresh -h github.com -s project
```

Never edit the user's token scopes without being asked.

## Commands

IDs below were read from the board. If a call fails with a not-found error, refresh them with `gh project field-list 1 --owner Angkop --format json` and update this file.

| Thing | Value |
|---|---|
| Repo | `Angkop/angkop-app` |
| Project number / owner | `1` / `Angkop` |
| Project id | `PVT_kwHOE0z1284BihLg` |
| Status field id | `PVTSSF_lAHOE0z1284BihLgzhhY9KU` |
| Status options | Backlog `f75ad846`, Ready `61e4505c`, In progress `47fc9ee4`, In review `df73e18b`, Done `98236657` |
| Priority field id | `PVTSSF_lAHOE0z1284BihLgzhhY9Y8` (P0 `79628723`, P1 `0a877460`, P2 `da944a9c`) |
| Size field id | `PVTSSF_lAHOE0z1284BihLgzhhY9ZA` (XS `6c6483d2`, S `f784b110`, M `7515a9f1`, L `817d0097`, XL `db339eb2`) |

Team GitHub logins: `JPAVictoria`, `Brave-Osio`, `kangnathan`. Anyone else must be a repo collaborator. List who can be assigned with `gh api repos/Angkop/angkop-app/assignees --jq '.[].login'`.

Create one ticket. Write the body to a file first, because inline `\n` gets mangled by shell `echo` in zsh:

```bash
BODY=$(mktemp)
cat > "$BODY" <<'EOF'
## Problem
- ...

## Verification
- ...
EOF

# add `--assignee <login>` only when the user named one
url=$(gh issue create --repo Angkop/angkop-app --title "<title>" --body-file "$BODY")
num=${url##*/}

# The board may auto-add new issues, so a "Content already exists" error here is fine.
gh project item-add 1 --owner Angkop --url "$url" >/dev/null 2>&1
sleep 2
item=$(gh project item-list 1 --owner Angkop --limit 200 --format json \
  | jq -r --argjson n "$num" '.items[] | select(.content.number==$n) | .id')

# Status = Ready (swap the option id for another column)
gh project item-edit --id "$item" --project-id PVT_kwHOE0z1284BihLg \
  --field-id PVTSSF_lAHOE0z1284BihLgzhhY9KU --single-select-option-id 61e4505c >/dev/null

# Read it back
gh project item-list 1 --owner Angkop --limit 200 --format json \
  | jq -r --argjson n "$num" '.items[] | select(.content.number==$n) | "#\(.content.number) \(.title) | status=\(.status) | assignees=\(.assignees // [])"'
```

For several tickets, write each body to its own file and loop over them. Build JSON with `jq`, never with `echo`.

Edit an existing ticket: `gh issue edit <n> --repo Angkop/angkop-app --title ... --body-file ... --add-assignee <login>`. Fetch the current body first with `gh issue view <n> --json body --jq .body` and change only what was asked.

## Rules

- Do not close, delete or transfer issues unless asked.
- Do not set Priority or Size unless the user gives a rule or value.
- Report guesses: say which wording or defaults you assumed so the user can correct them.
- No exclamation points, no emojis in ticket text. Copy rules in `.claude/rules/design.md` apply to anything user-facing the ticket describes.
