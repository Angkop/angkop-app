# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Filipino job seekers, especially fresh graduates and first-time workforce entrants. They struggle to match their actual competencies against job listings because existing platforms (JobStreet, Indeed, LinkedIn) rely on keyword search: a "React developer" never matches a "front-end engineer" posting, and the burden of interpreting listings falls on the seeker. They use the product on desktop and mobile browsers.

Secondary audience: the thesis evaluators (30 job-seeker end-users and 10 IT/AI experts) who score the product against ISO/IEC 25010 criteria.

## Product Purpose

Angkop is a hybrid job matching and career recommendation system. It ranks jobs by meaning rather than keywords, shows how well a seeker fits each one, names the skills that would close the gap and maps them to third-party courses, and helps them track and send applications. Success is a fresh graduate finding suitable roles they would not have found by keyword search. It is a BS Computer Science thesis project (Lyceum of Alabang, July 2026).

## Positioning

Matching on competencies, not keywords: Sentence-BERT semantic similarity blended with neural collaborative filtering, so a "Call center agent" scores highly against a "Customer Support Specialist" posting that shares no words with the profile. Every score comes with a skill-gap roadmap rather than a bare number.

## Operating Context

- Web dashboard (React/Next.js) queries the Express API over GraphQL; a Manifest V3 browser extension overlays match scores on Angkop's own listing pages only.
- Job listings come from vetted public APIs (RemoteOK, Arbeitnow) ingested into Angkop's own database; Angkop never scrapes third-party job platforms.
- Application tracking statuses: pending, applied, awaiting interview, ongoing interview, interviewed, successful, unsuccessful, plus custom tags. Seekers can save, dismiss, or delete listings.
- AI-drafted cover letters and application emails (Gemini) are shown as editable text; the seeker reviews and explicitly approves before anything is sent from their own Gmail account.
- Existing dashboard modules: all matches, listings, listing detail, applications, skill gaps, profile, onboarding, sign-in.

## Capabilities and Constraints

- Match score is always shown as a percentage with a label explaining what it means. Strong is 70% and up, partial is 40 to 69%, weak is below 40.
- Skill gap labels are constructive ("Add React", not "Missing React").
- Sending email is consent-gated: never automatic, and `gmail.send` is requested through incremental OAuth, separate from sign-in.
- Raw embeddings never reach the client.
- No native app: no push notifications, no offline.
- Free-tier API and hosting limits apply.
- New users face a cold start with less refined recommendations until interaction history accumulates.
- Product copy is English only.

## Brand Commitments

- Name: Angkop.
- The beaver mascot is a binding brand asset (confirmed; it replaced the earlier capybara). It currently appears on the sign-in page as a 3D hero with thought bubbles and job try-on demos; future surfaces should keep it recognizable.
- Copy rules from the project: buttons pair a verb with its object ("Save Profile", "View Matches"), and no exclamation points.

## Evidence on Hand

- Illustrative match examples on the sign-in page (`modules/login-page/constants.ts`): React developer to Front-end Engineer, Call center agent to Customer Support Specialist, Bookkeeper to Accounting Assistant. These are labeled illustrative only.
- No real user testimonials, usage metrics, or evaluation results exist yet; do not fabricate any.

## Product Principles

1. Meaning over keywords: every surface should make clear that a fit is judged by competencies, not matching words.
2. A score is never alone: pair it with what it means and the next skill that would improve it.
3. Constructive, not discouraging: the audience is first-time entrants, so gaps read as a path forward.
4. The seeker stays in control: nothing is sent, saved, or discarded without their explicit action.
5. Honest about uncertainty: cold-start and illustrative data are labeled as such.

## Accessibility & Inclusion

No requirements beyond the ISO/IEC 25010 evaluation criteria (including Usability and Compatibility) were set. The interface must work on both desktop and mobile browsers.
