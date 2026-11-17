---
name: frontend-practices
description: Angkop web dashboard practices for forms, mutations, loading states, filters, React state and performance. Use when building or changing any form, field, mutation, filter, list or page module in apps/web, or when reviewing frontend code.
---

# Frontend practices

Adapted from the practices in oboda-app, rewritten for Angkop's stack: Next.js, Tailwind, shadcn/ui (`radix-ui`), Apollo Client, Sonner.

Read `.claude/rules/design.md` (components, tokens, copy, match score colors) and `.claude/rules/coding-style.md` (thin pages, `modules/<page-name>/`) first. This skill covers behavior, not looks, and does not repeat those files.

## Forms

Standard: **react-hook-form + zod** (`@hookform/resolvers/zod`).

- `react-hook-form`, `zod` and `@hookform/resolvers` are installed. The profile form is the reference: `hooks/use-profile-editor.ts` (`useForm` + `zodResolver`, `values` prefill with `keepDirtyValues`), `lib/profile-schema.ts` (the zod schema) and `components/profile-fields/` (fields read the form through `useFormContext`, `useController` and `useFieldArray`).
- One `useForm` per form. Types come from `@angkop/shared` first, and the zod schema is typed against them. Never redefine a shared type.
- Validation lives in the schema, not in `onChange` handlers. Do not mirror form values in `useState`.
- Any new or touched form uses react-hook-form. Do not add controlled-through-props fields.
- Field anatomy: `Label` with `htmlFor`, the control, optional help text, inline error. Use `FormField` (`components/form-field.tsx`) for every field. It wires `aria-invalid` and `aria-describedby` through its render-prop `controlProps`, so do not repeat the `space-y-1.5` block.
- Pick lists use `OptionSelect` (`components/option-select.tsx`) and chip groups use `ChipListField` before a new control is built.
- Error messages name the specific problem ("Add a company name", never "Invalid input"). No exclamation points.
- An invalid field changes its border and shows its message together, and sets `aria-invalid` and `aria-describedby`. The error replaces the help text.
- Read-only is not disabled. Disabled means "not editable right now". Read-only means "this view does not edit".
- Dependent fields handle three paths: the source is set, the source is cleared (clear the dependents), and the source is set programmatically by a default or prefill (`setValue(..., { shouldDirty: true })`). An empty prefill resets the rows. Never early-return on it.
- Use `dirtyFields`, `touchedFields`, `errors` and `submitCount` from react-hook-form for dirty or submitted logic.
- Tabs or sections that need a saved record are disabled in create mode.
- After a successful save, `reset` the form to the saved values so the form is not dirty.

## Mutations

- Every mutation surfaces failure with `toast.error(title, { description })`. A mutation with no error path fails silently. Match the existing pattern in `modules/all-matches-page` and `modules/applications-page`.
- Success toasts are factual and specific ("Status updated to Applied"), not "Success".
- After a mutation, refresh everything that shows the changed data: the list, the detail view and any stats query. Use `refetchQueries` or a cache update. Skipping one leaves stale data on screen.
- Apollo does not know a profile edit makes scores stale. After a mutation that changes the profile, evict `jobMatches`, `jobMatchInsight`, `savedJobs` and `skillGaps` (see `persist` in `hooks/use-profile-editor.ts`) so the next read goes to the network. Do the same for any new query derived from data a mutation changes.
- The one primary button goes loading and non-interactive the moment it is pressed, so nothing double-submits. For confirmations pass the mutation's `loading` to `ConfirmDialog`'s `isConfirming`.
- Destructive actions confirm first through `ConfirmDialog` and name what will be affected.
- Gmail sending is consent-gated: never send an AI draft without the explicit approval step (see CLAUDE.md).

## Queries and data

- Skip queries that need a value you don't have yet: `skip: !userId`.
- Every list is server-side paginated (`page` and `pageSize` args, `{ items, total }`). Never fetch everything and slice on the client.
- Search inputs are debounced, and the debounced value is what goes into the query variables.
- Never render or log raw embeddings (`Float[]`). They are internal only.
- Scores, skill gaps and course recommendations are computed on the server. Render the field as returned and never recompute or rescale it on the client. Read the resolver's derivation before doing math on a server value.

## Loading and empty states

- Skeleton for a whole page or content area. Spinner only inside a button or modal.
- Do not use a full-page spinner where a skeleton belongs.
- Every empty state says why it is empty and what the user can do next.
- Errors from queries show `ErrorMessage` with a retry, not a blank area.

## Filters and lists

- A filter pill starts inactive (label and arrow only) and becomes active only once a value is applied, then shows a count badge. A state change is background and text color together.
- Show a limited number of options by default and let the user search for the rest. Active filters stay visible and easy to remove.
- Sorting happens through column headers, not the filter row.
- Filtering, searching and sorting run on the server.

## React state

- Never use `useRef` to mirror props, watched values, route state or dirty/touched/submitted flags when `.current` affects JSX, validation, disabled states, resets or submit logic.
- Refs are for DOM nodes, timers, abort controllers, imperative third-party APIs and values used only inside event handlers.
- Derive values during render. Use `useMemo` for expensive derivations, not `useEffect` plus `setState`.
- Lazy state init for expensive starts: `useState(() => expensive())`.

## Performance

- `Promise.all` for independent async work, no sequential await chains.
- `Map` or `Set` for lookups inside loops, not `array.find` or `includes`.
- `for-of` with an early `continue` on large collections, not `filter` then `map` chains.
- Import from the file, not from barrel re-exports.
- Lazy-load heavy components with `next/dynamic` or `React.lazy` (for example the three.js sign-in hero, charts, anything over about 50KB).
- `useCallback` for handlers passed to memoized children, and stable `key` props on lists.
- Measure before and after any optimization and record the numbers in the PR.

## Accessibility and responsive

- Every control has a label. Keyboard navigation and visible focus work on every interactive element.
- Never rely on color alone: match scores and statuses always carry a text label.
- Usable at phone width with no horizontal page scroll. Touch targets are large enough to tap.

## Before calling it done

- `pnpm type-check` and `pnpm lint` pass, with no `any`, `as any`, `// @ts-ignore` or `console.log`.
- Grep for an existing component or hook before writing a new one (`components/`, `components/ui/`, `hooks/`, `lib/`).
- Failure path checked: the mutation fails and a toast shows. The query fails and an error state shows.
- Loading, empty, error and success states all rendered at least once.
