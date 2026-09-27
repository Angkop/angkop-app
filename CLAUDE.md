# Angkop — Project Context

## What Is Angkop

Angkop is a BS Computer Science thesis project (Lyceum of Alabang, July 2026) by:
- Osio, Brave John M.
- Rosales, Karl Nathan R.
- Victoria, Jan Paul Andre
- Ydel, Blessed Monica A.

It is a **multi-platform hybrid job matching and career recommendation system** designed for Filipino job seekers — especially fresh graduates and first-time workforce entrants — who struggle to match their actual competencies against job listings due to keyword-based platform limitations.

---

## Core Problem

Existing job platforms (JobStreet, Indeed, LinkedIn, etc.) use **keyword-based search**, so a "React developer" never matches a posting for a "front-end engineer" even though they're the same role. The burden of interpreting job postings falls entirely on the job seeker. In the Philippines, this contributes to extended unemployment and underemployment among fresh graduates who lack skills not because suitable roles are absent, but because they have no intelligent means of finding them.

---

## Solution Architecture

Angkop operates as **two coordinated services** plus a browser extension:

### 1. Browser Extension (Data Capture Layer)
- Built with **Manifest V3** (content scripts + background service worker)
- Operates **exclusively on Angkop's own job listing pages** — reads job posting text from listings Angkop has already ingested and hosts itself; it never visits or scrapes any third-party job platform directly
- Injects a match-score overlay directly onto those listing pages
- Logs weighted implicit feedback events:
  - Application > Save > View > Dismissal
- Sends the read job data and behavior events to the Express API

### 2. Data Sourcing Layer (Job Ingestion)
- A scheduled ingestion process pulls job postings from **public, no-authentication job-listing APIs** (e.g. RemoteOK, Arbeitnow) — sources explicitly built for external reuse
- Ingested postings are written into Angkop's own PostgreSQL database and served through Angkop's own listing pages
- Angkop does **not** scrape or otherwise access any third-party job platform (JobStreet, LinkedIn, Indeed, etc.) directly
- Any candidate source is checked against the **Data Source Vetting Criteria** (below) before being added

### 3. Express API (Application Layer)
- **Node.js + Express.js** REST + **GraphQL (Apollo Server)**
- Handles: Google OAuth authentication, profile CRUD, job ingestion/tracking, application tracking (status + custom tags)
- Orchestrates calls to the FastAPI ML microservice, including the Gemini-based application draft generator
- Sends approved application drafts through the Gmail API (see **Application Drafts & Sending** below)
- Data access via **Prisma ORM** → **PostgreSQL (Supabase)**

### 4. FastAPI ML Microservice (Intelligence Layer)
- **Python + FastAPI**
- Hosts four sub-components:
  - **Embedding Generator**: loads `all-MiniLM-L6-v2` (Sentence-BERT), outputs 768-dimensional vectors
  - **Hybrid Ranking Engine**: combines Sentence-BERT cosine similarity score + NCF collaborative score
  - **Skill Gap Analyzer**: vector subtraction (job embedding − user embedding), maps missing dimensions to course recommendations
  - **Application Draft Generator**: calls the Gemini API with the job description + user profile to draft a cover letter and application email

### 5. Web Dashboard (Presentation Layer)
- **React.js** SPA, queries Express API via GraphQL
- Shows: ranked job matches, skill gap roadmap, course recommendations, application history
- Save, dismiss, or delete job listings; track application status (pending, applied, awaiting interview, ongoing interview, interviewed, successful, unsuccessful) with custom tags
- Review, edit, and approve AI-generated cover letters/emails before they're sent
- Accessible on both desktop and mobile browsers (no native app)

### 6. Data & Caching Layer
- **PostgreSQL on Supabase** + **pgvector extension** for storing 768-dim embeddings
- **Prisma ORM** for schema management (soft-deletes only — no hard deletes)
- **Redis** for caching computed match scores and recommendation lists (TTL = 24h)

---

## Data Source Vetting Criteria

Any additional public API considered for the ingestion process is evaluated against every criterion below before it's added as a data source:
- Publicly accessible, no login required to view
- No sensitive or personal information is collected
- Where published, `robots.txt` permits automated access to the relevant endpoints
- Terms of Service explicitly permit, or do not prohibit, automated/programmatic access
- Intended use (powering job recommendations for job seekers) is consistent with what the source permits
- Data is exposed through a stable, documented interface — not one designed only for manual browsing
- Requests are made at a reasonable frequency that doesn't place undue load on the source
- No bypassing authentication, CAPTCHA, or other access controls
- Only structured fields needed for matching (title, description, location, etc.) are stored — retrieved content is never republished wholesale

## Application Drafts & Sending

- The FastAPI microservice's Application Draft Generator calls the **Gemini API** with the job description and the user's profile to produce a tailored cover letter and application email
- Drafts are returned to the web dashboard as **editable text** and are **never sent automatically**
- Sending requires the user's **explicit approval** of the draft; the Express API then sends it through the **Gmail API** using the user's own Gmail account
- Sending requires an additional, separate `gmail.send` OAuth scope granted through **incremental consent** — distinct from the basic Google sign-in scope used at login

---

## Core ML Approach

### Semantic Matching — Sentence-BERT
- Converts user skill profiles and job descriptions into sentence-level embeddings
- Compares them via **cosine similarity** to capture meaning, not just surface keywords
- Model: `all-MiniLM-L6-v2`

### Collaborative Filtering — Neural Collaborative Filtering (NCF)
- Based on He et al. (2017) NeuMF architecture (GMF + MLP)
- Learns from implicit user-job interaction history (views, saves, applications)
- Trained offline (Google Colab), deployed weights to FastAPI
- Requires sufficient interaction data; new users receive less refined recommendations (cold start)

### Hybrid Ranking
```
hybrid_score = combine(semantic_score, collaborative_score)
```
The weighting blends both signals, with collaborative signal gaining weight as interaction history grows.

### Skill Gap Detection
```
gap_vector = job_embedding - user_embedding
missing_dimensions = top_k(gap_vector, k=5)
missing_skills = map_dimensions_to_labels(missing_dimensions, skill_labels)
recommended_courses = CourseIndex.lookup(missing_skills)
```

---

## Real-Time Match Score Flow

1. Browser extension reads job posting text from Angkop's own listing pages
2. Express API checks Redis cache for `(user_id, job_id)` pair
3. Cache miss → FastAPI embeds job text + user skills text
4. FastAPI computes cosine similarity + NCF score → returns hybrid score
5. Express API caches result in Redis (24h TTL), stores embedding in PostgreSQL
6. Browser extension displays score as overlay on the listing page

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Browser Extension | Manifest V3, JavaScript |
| Backend API | Node.js, Express.js, Apollo Server (GraphQL) |
| ML Microservice | Python, FastAPI, PyTorch, Sentence-Transformers |
| Web Dashboard | React.js |
| Primary DB | PostgreSQL (Supabase) + pgvector |
| ORM | Prisma |
| Cache | Redis |
| Auth | Google OAuth 2.0 via Supabase Auth (web) / Chrome Identity API (extension) — single Supabase-issued session JWT |
| AI Draft Generation | Google Gemini API |
| Email Sending | Gmail API (`gmail.send`, incremental OAuth consent) |
| Model Training | Google Colab |

---

## Job Data Sources

Angkop never scrapes or accesses third-party job platforms directly. All job listings come from **public, no-authentication job-listing APIs**, vetted against the Data Source Vetting Criteria above, ingested into Angkop's own database, and served through Angkop's own listing pages — which is what the browser extension actually reads.

Current sources (see `apps/server/src/scripts/ingest-jobs.ts`):
1. RemoteOK
2. Arbeitnow

Future expansion is limited to adding more vetted public, no-authentication APIs to this list — it does not involve visiting or scraping additional third-party websites.

---

## Scope & Limitations

**In scope:**
- Hybrid semantic + collaborative recommendation
- Browser extension with match-score overlay on Angkop's own listing pages
- Job ingestion from vetted, public, no-authentication job-listing APIs
- Web dashboard (desktop + mobile browser)
- Skill gap detection mapped to course recommendations
- Profile, application (status + custom tags), and interaction tracking
- AI-generated cover letter/application email drafts (Gemini), sent only after explicit user approval via Gmail

**Out of scope:**
- Native mobile app (no push notifications, no offline)
- Scraping or otherwise directly accessing any third-party job platform (JobStreet, LinkedIn, Indeed, etc.)
- Sending application emails without the user's explicit approval of the draft
- Hosting/creating learning content (maps to third-party courses only)
- Free-tier API/hosting limits apply

---

## Development Methodology

**Agile Scrum** with 2-week sprints. Team of 4, rotating Scrum Master role. Each sprint delivers a working, testable increment.

### Epics
1. Core Backend and Authentication
2. Browser Extension and Data Capture
3. Semantic Matching Engine
4. Collaborative Filtering and Personalization
5. Skill Gap Detection and Course Recommendations
6. Web Dashboard and Analytics

---

## Evaluation

- **40 respondents**: 30 job seeker end-users + 10 IT/AI experts
- Instrument: ISO/IEC 25010:2011 Software Evaluation Questionnaire
- Criteria: Functional Suitability, Reliability, Usability, Performance Efficiency, Maintainability, Security, Compatibility
- Scale: 5-point Likert, scored 1.00–5.00

---

## Key Rules for This Codebase

- **Soft-deletes only**: never call `prisma.*.delete` or `prisma.*.deleteMany` — set `deleted: true` instead
- No `any`, `as any`, `// @ts-ignore`, or `console.log` — CI will reject these
- Schema migrations and permission/auth changes require explicit user approval before proceeding
- For data fix scripts, use `/script-maker` and wrap destructive ops behind a `DRY_RUN` guard
- Before writing new code, check for an existing service — do not duplicate
- **Gmail sending is consent-gated**: never send an application email automatically — always require the user's explicit approval of the AI-generated draft first, and always request `gmail.send` via incremental OAuth, never bundled into basic sign-in

## Before Writing Code

- **Any work** → read `.claude/rules/coding-style.md`
- **Frontend / UI** → read `.claude/rules/design.md` first
- **Data operations** → read `.claude/rules/data-safety.md`
- **Commits / PRs** → follow `.claude/rules/git-workflow.md`
- **Reviewing AI output** → read `.claude/rules/ai-collaboration.md`
