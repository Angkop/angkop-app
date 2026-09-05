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
- Scrapes job posting text in real time from: **JobStreet, Indeed, LinkedIn, Kalibrr, PhilJobNet, Glassdoor**
- Injects a match-score overlay directly onto listing pages
- Logs weighted implicit feedback events:
  - Application > Save > View > Dismissal
- Sends scraped data and behavior events to the Express API

### 2. Express API (Application Layer)
- **Node.js + Express.js** REST + **GraphQL (Apollo Server)**
- Handles: auth, profile CRUD, job tracking, application tracking
- Orchestrates calls to the FastAPI ML microservice
- Data access via **Prisma ORM** → **PostgreSQL (Supabase)**

### 3. FastAPI ML Microservice (Intelligence Layer)
- **Python + FastAPI**
- Hosts three sub-components:
  - **Embedding Generator**: loads `all-MiniLM-L6-v2` (Sentence-BERT), outputs 768-dimensional vectors
  - **Hybrid Ranking Engine**: combines Sentence-BERT cosine similarity score + NCF collaborative score
  - **Skill Gap Analyzer**: vector subtraction (job embedding − user embedding), maps missing dimensions to course recommendations

### 4. Web Dashboard (Presentation Layer)
- **React.js** SPA, queries Express API via GraphQL
- Shows: ranked job matches, skill gap roadmap, course recommendations, application history
- Accessible on both desktop and mobile browsers (no native app)

### 5. Data & Caching Layer
- **PostgreSQL on Supabase** + **pgvector extension** for storing 768-dim embeddings
- **Prisma ORM** for schema management (soft-deletes only — no hard deletes)
- **Redis** for caching computed match scores and recommendation lists (TTL = 24h)

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

1. Browser extension scrapes job listing text
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
| Auth | Supabase Auth + JWT |
| Model Training | Google Colab |

---

## Supported Job Platforms (Browser Extension)

1. JobStreet
2. Indeed
3. LinkedIn
4. Kalibrr
5. PhilJobNet
6. Glassdoor

---

## Scope & Limitations

**In scope:**
- Hybrid semantic + collaborative recommendation
- Browser extension with overlay for 6 platforms
- Web dashboard (desktop + mobile browser)
- Skill gap detection mapped to course recommendations
- Profile, application, and interaction tracking

**Out of scope:**
- Native mobile app (no push notifications, no offline)
- Platforms outside the 6 listed integrations
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

## Before Writing Code

- **Any work** → read `.claude/rules/coding-style.md`
- **Frontend / UI** → read `.claude/rules/design.md` first
- **Data operations** → read `.claude/rules/data-safety.md`
- **Commits / PRs** → follow `.claude/rules/git-workflow.md`
