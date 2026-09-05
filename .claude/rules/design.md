---
description: UI and design conventions for the Next.js dashboard
---

# Design

## Components
- Use shadcn/ui components first — don't build a custom component if shadcn has one
- Check `components/ui/` before writing any new UI primitive
- Icons come from `lucide-react` only — don't mix icon sets

## Tailwind
- Use Tailwind design tokens (colors, spacing, radius) — no hardcoded hex values, no inline `style={{}}`
- Stick to the shadcn/ui CSS variable palette (`--background`, `--foreground`, `--primary`, etc.)

## Patterns
- One primary action button per screen
- Destructive actions (delete, clear) always confirm first, naming what will be affected
- Loading states: use skeleton loaders, not spinners, for content areas
- Empty states: always show a message explaining why the area is empty and what the user can do

## Match Score Display
- Score is always shown as a percentage (e.g. 87%)
- Color meaning: green = strong match (≥70%), yellow = partial (40–69%), red = weak (<40%)
- Never show a score without a label explaining what it means

## Copy
- Buttons pair a verb with its object ("Save Profile", "View Matches", not "Submit" or "OK")
- No exclamation points
- Skill gap labels are constructive, not negative ("Add React" not "Missing React")
