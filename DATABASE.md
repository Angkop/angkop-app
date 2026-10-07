# Database Notes

Context behind non-obvious fields in `apps/server/prisma/schema.prisma` — see that file for
the actual column list/types. Written as fields are added; not a full schema reference.

## `Job`

### `sourceName` / `sourceUrl`

Attribution for jobs ingested from a real public job API (RemoteOK, Arbeitnow) and
re-served on our own `/listings` pages — null for hand-written seed/demo jobs. Most free
job-board APIs require linking back to the original posting; this is that link.

### `location` / `salaryMin` / `salaryMax` / `workSetup` / `employmentType`

Real fields from the source API when it provides them, deliberately typed to match
`UserPreference`'s matching fields (`location`/`salary`/`workSetup`/`employmentType`) so the
recommendation algorithm can compare job vs. preference directly instead of just text. Null
when the source genuinely didn't say — **never backfilled or guessed**:

- `location`: RemoteOK + Arbeitnow both report this directly.
- `salaryMin`/`salaryMax`: RemoteOK only; Arbeitnow has no salary field at all.
- `workSetup`: RemoteOK jobs are all `REMOTE` by definition of that platform; Arbeitnow's
  boolean `remote` maps to `REMOTE`/`ONSITE` (it never reports `HYBRID`, so that value is
  simply never produced by ingestion, not guessed at).
- `employmentType`: Arbeitnow's `job_types` only, mapped to this enum when recognized;
  RemoteOK doesn't report it. Unrecognized values stay null rather than mis-mapped.

### `descriptionSections`

The description's prose split into sections by its own headings (shape:
`DescriptionSection[]` in `@angkop/shared` — `{ heading: string | null; items: string[] }`),
so the listing detail page can render Tasks/Requirements/Benefits etc. as real lists instead
of one flattened paragraph. See `apps/server/src/scripts/ingest-jobs.ts`'s
`parseDescriptionSections` for how source HTML is split (real `<h1-h6>` tags, or a `<p>`
whose entire content is one bolded phrase — both patterns appear across RemoteOK and
Arbeitnow). Null for rows ingested before this field existed.

### `detectedLanguage`

Detected locally (`franc-min`, no external call) from the source's own description text —
null means English or undetermined. **Never translated server-side**: the detail page just
surfaces this label and links out to Google Translate, since an LLM call per listing isn't
worth the cost for text the browser (or the original poster) already lets a reader
translate. (An earlier version of this called Gemini per non-English listing to translate it
server-side — reverted as unnecessarily expensive for what a free client-side translate link
solves just as well.)
