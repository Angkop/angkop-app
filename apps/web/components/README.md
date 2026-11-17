# Shared components

Reusable UI lives here, and every shared component is shown on the **components playground** at `/components-playground`. The page has no nav link: type the URL. It is marked `noindex`. The sidebar shows one component group at a time, and the group is in the URL (`?section=fields`), so a page can be linked.

Check the playground before building a local copy of a field, filter, empty state or loader.

## Where things go

| Folder | What belongs there |
|---|---|
| `ui/` | shadcn/ui primitives built on `radix-ui`: button, input, select, checkbox, popover, table and so on |
| `common/form/` | Form fields. `Form.Field` takes a `fieldType` (see `constants/field-type.ts`) and wires value, error and aria props from react-hook-form |
| `common/` | Other shared pieces built from `ui/` (`FilterSelect`, `EmptyState`) |
| `common/file-upload/` | `FileDropzone`, `FilePreviewList` and `formatFileSize` |
| `components/` (this folder) | Older shared components (`FormField`, `MatchScoreBadge`, `ConfirmDialog`, and others) |

## Look and feel

Shared components follow Oboda's geometry, with Angkop's own colors (the tokens in `globals.css`). Change a primitive in `ui/` and every page follows, so keep to these numbers:

| Piece | Spec |
|---|---|
| Fields (input, select, textarea) | 41px tall, 8px radius, 1px `border-input`, focus is a 2px `primary` border, 14px text, label 14px regular `muted-foreground` |
| Fields, `size="sm"` | 36px tall (the height of a button) for dense forms. Opt in per field with `Form.Field size="sm"`. The profile editor uses it through `ProfileField` |
| Buttons | 36px tall, 25px side padding, 8px radius, 14px semibold, hover is 80% opacity, outline variant uses `primary`, focus is a 2px `primary` outline at 2px offset |
| Menus, selects, popovers | 12px radius, 8px padding, items 8px radius with 4px gaps, hover `accent`, selected `primary/10` |
| Cards, dialogs, tables | 12px radius, 24px padding, no shadow on cards |
| Dialogs | `accent`-tinted header, bold 20px title, everything between header and footer gets 24px side padding, full-width 42px footer buttons, bottom sheet under `sm` |
| Tables | 16px by 24px cells, small bold header, 1px row lines |
| Tabs | 24px pill radius |
| Checkbox, radio | 18px, switch 36 by 20px |
| File drop zone | 2px dashed border, 32px padding, `primary` border on hover or drag |

## Add a component to the playground

1. Build it with shadcn/ui as the base, `lucide-react` icons and CSS variable tokens (`bg-primary`, `text-muted-foreground`). No hex values, no hardcoded Tailwind colors, no inline `style`.
2. Import types from `@angkop/shared` when they exist. Do not redefine them.
3. Open the section that fits in `modules/components-playground-page/components/` (fields, buttons, selects-filters, cards, badges, loaders, empty-states, overlays, tables-lists). Add a new section file only when none fits, and register it in `constants/sections.ts` (the sidebar entry) and in `SECTION_COMPONENTS` in `components-playground-page.tsx`.
4. Add one `<Variant label usage>` per state: default, disabled, loading, error and empty where they apply. `usage` is the props that produce it. Hover and focus are live, so they need no variant.
5. Sample data goes in `constants/sample-data.ts`. Use realistic Angkop data, and never raw embeddings.
6. A section that passes a handler needs `'use client'` at the top of its file.
7. Check the page at phone width (390px), then run `pnpm type-check` and `pnpm lint`.

## Adding a form field type

1. Build the control as a plain controlled component in `common/form/` (`value` and `onValueChange`), so it also works outside a form.
2. Add its key to `FIELD_TYPE` and a `case` in `common/form/field.tsx`.
3. Add its variants, including an error state through `FormField`, to the fields section of the playground.
