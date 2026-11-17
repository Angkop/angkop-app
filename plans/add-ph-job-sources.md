# Plan: Add Philippine job sources (Headcount Labs, Careerjet)

> Goal: decide whether Headcount Labs and Careerjet can feed the ingestion pipeline with Philippine listings, and lay out how Headcount Labs would be added if the team approves. No code is part of this plan. It is a go/no-go write-up plus an implementation outline.

Research date: 2026-11-17. Everything below comes from the vendors' public docs and landing pages. Nothing was called with a real API key, so anything marked **unverified** has to be confirmed after signup.

## Verdict

| | Headcount Labs | Careerjet |
|---|---|---|
| Technically usable for scheduled ingestion | Yes | Poor fit |
| Philippines coverage | **Unverified** (no PH figure found on any public page) | Likely (`en_PH` locale), confirmed only by a third-party client |
| Auth | Bearer API key (free signup, no card) | Basic auth API key from a Publisher account |
| Storing data in our DB | Explicitly permitted (data licence) | **Not stated anywhere I could find** |
| Description text | Included, but excluded from the open licence | Truncated snippet (`fragment_size`, default 120 chars) |
| Fits the Data Source Vetting Criteria | Mostly, with two open items | No, not without Careerjet's written terms |
| Recommendation | Proceed, behind the three gates below | Do not add; revisit only if Careerjet confirms terms in writing |

## Blocker for both: the "no-authentication" rule

`CLAUDE.md` limits ingestion to public, **no-authentication** APIs, and the first vetting criterion is "no login required to view". Both services need an API key. Adding either one means amending that scope in `CLAUDE.md`. That is a team decision, so this plan does not edit `CLAUDE.md`.

## Headcount Labs

### What the API offers

- Base host `api.headcountlabs.com`, bearer token auth.
- `GET /v1/jobs`: first load. `country` takes two-letter codes (examples use `US`, `CA`). `limit` defaults to 50, max 250. Sorted by `job_updated_at` descending. Response envelope is `{ data, next_cursor, snapshot_watermark }`.
- `GET /v1/jobs/count`: one request, returns no jobs, never uses job records. This is how we check PH volume.
- `GET /v1/jobs/changes`: incremental sync. Send `since`, then pass `resume_cursor` back as `after` while `has_more` is true. Change types are `created`, `updated` (both include the job) and `expired` (ID and time only).
- Bulk export: up to 100,000 jobs per export.
- Data comes from employers' career pages and ATS boards (Greenhouse, Lever, Workday), re-checked every 24 hours.

### Fields we would map

| Headcount Labs | NormalizedListing |
|---|---|
| `job_id` | `id` (`angkop-headcountlabs-<job_id>`) |
| `title` | `title` |
| `employer_name` | `company` |
| `description` | `description` + `descriptionSections` |
| `locations[]` | `location` |
| `work_arrangement` | `workSetup` |
| `postings[0].posting_url.value` | `sourceUrl` |
| `postings[0].pay` (envelope; `extraction_failed` in all 5 probed jobs, value shape not yet seen) | `salaryMin` / `salaryMax` |
| `postings[0].attribution` (`required`, `text`, `link`; all null in the 5 probed jobs) | needs a home, see Decisions |

Confirmed by a live probe on 2026-11-17: list responses are `{ data, next_cursor, total, total_is_estimate, snapshot_watermark }`. `locations[].value` is `{ city, region, country, street, ... }`. `work_arrangement` values seen: `in_person`, `hybrid`, plus `source_unmapped` and `source_omitted` states. `description.value` is plain text with `\n` breaks, from 236 to 12,748 chars in the sample, and one job had `source_omitted`. Job payloads are large (about 25 KB each), so use the `fields` param to trim them.

State-bearing fields (`title`, `description`, `employer_name`, `work_arrangement`) arrive as an envelope: `known`, `source_omitted`, `source_unmapped`, `extraction_failed` or `derived`. Only `known` and `derived` carry a `value`. The adapter must unwrap these and treat the other three as missing, not as empty strings.

### Limits

- Free tier: 100,000 records per UTC month, 1 request per second, 1,000 requests per UTC day, shared across all keys in the account.
- When the allowance runs out and paid usage is off (the default, $0 cap), calls return `429 data_limit_exceeded`. There is no surprise bill. We should leave paid usage off.
- Response headers `X-Data-Records-Charged` and `X-Data-Records-Remaining` show exactly what each call cost. **Unverified:** whether each returned job in a list call counts as one record, and whether `/changes` rows count. Our first real calls should log these headers.

### Terms that matter to us

- Data licence (ODbL 1.0): "You may copy, adapt and use the data, including commercially." Storing in our DB is fine. Attribution is required only for public use.
- **Job description text, employer names and logos, and personal data are excluded from that licence.** We would need to be comfortable with those under the employer's rights. This overlaps the vetting rule that retrieved content is "never republished wholesale". We already show descriptions on `/listings`, capped at `MAX_DESCRIPTION_LENGTH` (1500) with a link back via `sourceUrl`.
- Terms bar using the data "as a factor in eligibility decisions for employment". Angkop ranks jobs for seekers and does not decide anyone's eligibility, so it looks fine, but the team should confirm.
- Public use needs the credit line: "Job data: Headcount Labs (https://headcountlabs.com), ODbL 1.0." Our listing pages are public, so the footer of `/listings` needs it.
- Per-posting `attribution.required` may add source-level credit requirements on top.
- No evading rate limits. Keep ingestion to the 1 request per second budget.

### Philippines coverage

Confirmed on 2026-11-17: `GET /v1/jobs/count?country=PH` returned `42466`, matching the "over 42,000" claim. The count call charged 0 records. A list call charges one record per job returned (5 jobs charged 5), so a full PH backfill would use about 42% of the 100,000 monthly allowance. The 100,000 per month free allowance is confirmed via the `x-data-records-limit` header.

## Careerjet

### What the API offers

- `GET https://search.api.careerjet.net/v4/query`, Basic auth with the API key as username and an empty password.
- `user_ip` and `user_agent` are required, or the call returns 403.
- Optional: `locale_code` (default `en_GB`), `keywords`, `location`, `contract_type`, `work_hours`, `sort`, `page` (1 to 10), `page_size` (1 to 100), `offset` (0 to 999), `fragment_size`.
- Response job fields: `title`, `company`, `date`, `description`, `locations`, `salary`, `salary_min`, `salary_max`, `salary_type`, `url`.

### Why it does not fit

1. **Built for live user searches, not batch ingestion.** `user_ip` and `user_agent` are meant to identify the end user making a search. A scheduled job has no such user, and sending a made-up value is the kind of workaround the vetting criteria rule out.
2. **Capped depth per query.** Pages stop at 10 and offset at 999, so each keyword and location query yields at most about 1,000 jobs. Broad coverage means many queries, each hitting a source with unstated rate limits.
3. **Snippet descriptions.** `description` is a fragment (default 120 chars). Our pipeline embeds `title. description` and detects skills from the full text, so snippets would produce weak embeddings and poor skill matching.
4. **`url` is Careerjet's redirect.** Fine for a link back, but no canonical posting URL.
5. **No storage terms found.** The API page, the publishers page and the sign-in page say nothing about caching or storing results. The program is described as "monetize your web traffic by displaying Careerjet's job listings", which is a display model. `/partners/terms` returned 404.
6. `en_PH` is listed only in a third-party client library. The official page says unsupported codes return HTTP 400 without listing supported ones.

If the team still wants Careerjet, the next step is emailing their partner contact (`/contact-us?c=partner`) for written confirmation of storage rights, rate limits and `user_ip` handling for server-side use. Without that, skip it.

## Durable decisions (if approved)

- **Headcount Labs only** for now. Careerjet stays out until written terms exist.
- **No schema changes by Claude beyond editing `schema.prisma`.** The developer runs any `prisma migrate` manually.
- **Soft deletes only.** `expired` change events set `deleted: true` on the matching `Job`. No `prisma.*.delete` or `deleteMany`.
- **Follow the existing adapter pattern.** A new `apps/server/src/scripts/ingest/sources/headcountlabs.ts` that returns `NormalizedListing[]`, wired into `ingest-jobs.ts` next to `fetchRemoteOk` and `fetchArbeitnow`. Reuse `parseDescriptionSections`, `flattenSections`, `USER_AGENT`, the pino logger and `EMPLOYMENT_TYPE_MAP`. No new ingestion service.
- **Key from env.** `HEADCOUNTLABS_API_KEY` in `.env.example` with an empty value. The adapter returns `[]` with a warning if it is unset, the same way a failed source is skipped today.
- **Stay inside the quota.** Log `X-Data-Records-*` headers each run. Stop the run on a 429 and honor `Retry-After`.
- **Raw embeddings stay internal**, as today.

## Phases

### Phase 0: Gates (no code)

1. Team decides whether to amend the "no-authentication" scope in `CLAUDE.md` and the vetting criteria. If yes, the team updates `CLAUDE.md` (sources list and scope) themselves.
2. Someone signs up for a free Headcount Labs key (opt out of paid usage) and runs `GET /v1/jobs/count?country=PH`. If PH volume is far below the claim, reconsider whether this is worth building.
3. Team reads `/license/` and `/data-rights/` and agrees that storing and showing capped description text with a link back is acceptable.

Exit: PH count confirmed, scope amended, description handling agreed.

### Phase 1: Probe

- Make a handful of `GET /v1/jobs?country=PH&limit=5` calls with a throwaway script in the scratchpad, not in the repo.
- Record the real field names for posting URL, pay and attribution, the shape of the state envelopes, and the `X-Data-Records-Charged` cost per call.
- Update this plan's mapping table with the confirmed names.

Exit: field mapping table has no unknowns.

### Phase 2: Adapter

- Add `sources/headcountlabs.ts` that pages `GET /v1/jobs` with `country=PH`, unwraps state envelopes, maps to `NormalizedListing`, and respects the 1 request per second pace.
- Cap the first backfill with a new constant in `ingest/constants.ts` (for example `HEADCOUNTLABS_MAX_JOBS`) so the initial run cannot burn more than a chosen share of the monthly 100,000 records.
- Note on throughput: `ingest-jobs.ts` embeds and upserts listings one at a time. Tens of thousands of listings will take a long time through the ML service, so the first backfill should run in capped batches.

Exit: a capped run ingests PH listings, which show on `/listings` with a working `sourceUrl`.

### Phase 3: Incremental sync

- Switch scheduled runs to `GET /v1/jobs/changes` with `since`, handling `created`, `updated` and `expired`.
- This needs somewhere to persist the last cursor or `since` timestamp. That is a small new model or column in `schema.prisma` (design it with the team, developer runs the migration).
- `expired` rows soft-delete the job and its `JobDescriptionSection` rows.

Exit: a repeat run costs only the changed records, and expired jobs disappear from listings.

### Phase 4: Attribution and docs

- Add the "Job data: Headcount Labs ... ODbL 1.0." credit to the `/listings` pages in `apps/web`, following `.claude/rules/design.md`.
- If per-posting `attribution.required` is true for some jobs, store and render that text. This probably needs a new nullable column on `Job` (schema change, developer-run).
- Update `CLAUDE.md` current sources, `ARCHITECTURE.md` and `DATABASE.md` once the above is merged.

## Open questions for the team

1. Are we willing to depend on a keyed API, given the existing "no-authentication" rule?
2. Is storing and displaying Headcount Labs description text, which sits outside the open licence, acceptable? The alternative is storing a short excerpt for embeddings and linking out for the full text.
3. How much of the free 100,000 monthly records should the PH backfill use?
4. Should PH listings be filtered to `country=PH` only, or should remote roles open to Philippine applicants be included too? The second needs the location filters in the Headcount Labs docs and a confirmed query.

## Sources

- Careerjet API: https://www.careerjet.com/partners/api, https://www.careerjet.com/partners/publishers
- Headcount Labs: https://headcountlabs.com, `/docs/`, `/docs/jobs/`, `/docs/data-fields/`, `/docs/rate-limits/`, `/docs/job-counts/`, `/docs/job-lifecycle/`, `/license/`, `/terms/`, `/coverage/`, `/coverage/countries/`
- Existing ingestion: `apps/server/src/scripts/ingest-jobs.ts`, `apps/server/src/scripts/ingest/`
