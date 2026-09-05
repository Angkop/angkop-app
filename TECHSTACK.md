# Angkop — Technology Stack

## 1. Frontend & Capture Layer

| Technology | Version | Use |
|---|---|---|
| Next.js (App Router) | 15.x (LTS) | Web dashboard — user profile, analytics, job feed, skill gap view. File-based routing, SSR/SSG. |
| Browser Extension (Manifest V3 + Vanilla JS) | Current MV3 spec | Sole data-capture surface — reads job listing pages, injects match-score overlay, logs behavior events (views, saves, applies, dismissals) |

## 2. Backend

| Technology | Version | Use |
|---|---|---|
| Node.js | 24.x (Active LTS) | Runtime for the Express API and build tooling |
| Express.js | 4.x | Core REST API — auth, profile CRUD, job saving/tracking, receives behavior events from the extension |
| GraphQL (Apollo Server) | 4.x | Flexible dashboard queries — each screen fetches only the data it needs |
| Python | 3.11 / 3.12 | Runtime for the ML microservice |
| FastAPI | 0.11x | Dedicated ML microservice — serves Sentence-BERT and NCF inference endpoints separately from the main API |

## 3. Algorithms & Neural Networks

| Technology | Version | Use |
|---|---|---|
| Sentence-BERT (`sentence-transformers`, `all-MiniLM-L6-v2`) | 3.x / 5.x | Converts skill/job text into 768-dim semantic embedding vectors |
| Hugging Face Transformers | 4.x | Required dependency for sentence-transformers |
| Cosine Similarity | N/A (algorithm) | Compares user and job embeddings to produce the real-time match score |
| Neural Collaborative Filtering (NCF) via PyTorch | PyTorch 2.x | GMF + MLP to learn preference patterns from weighted implicit feedback (applied > saved > viewed > dismissed) |
| Skill Gap Vector Subtraction | N/A (algorithm) | Subtracts user embedding from job embedding to identify missing skills |

## 4. Database & Caching

| Technology | Version | Use |
|---|---|---|
| PostgreSQL (hosted on Supabase) | 16.x / 17.x | Primary structured data store — users, jobs, interaction logs, applications, skill gaps |
| Prisma ORM | 5.x | Type-safe query layer and schema management between Node.js/Express and PostgreSQL |
| Redis | 7.x | Caches computed match scores and NCF recommendation lists to avoid recomputation on every request |

## 5. Auth & Hosting

| Technology | Version | Use |
|---|---|---|
| Supabase Auth / JWT | Managed | User authentication, included free with Supabase hosting |
| Vercel | Managed | Frontend hosting with automatic GitHub deploys |
| Render or Railway | Managed | Hosts the Node.js API and the FastAPI ML microservice |
| Supabase | Managed | Managed PostgreSQL hosting |
| Chrome Web Store | Current MV3 policy | Extension distribution ($5 one-time developer fee); sideload for local dev/testing |

## 6. Development Tools

| Tool | Version | Use |
|---|---|---|
| VS Code | Latest | Primary IDE across all layers |
| Git + GitHub | Latest | Version control and source hosting; triggers Vercel/Render auto-deploys |
| Postman / Insomnia | Latest | Manual REST and GraphQL endpoint testing |
| Prisma Studio | Bundled with Prisma 5.x | Visual browser for inspecting PostgreSQL data during development |
| Docker | Latest | Containerizes the FastAPI ML microservice for consistent local runs before deploying |
| Chrome DevTools | Bundled | Debugging MV3 extension — content scripts, service worker, DOM injection |
| Google Colab | Managed | Free GPU for training/experimenting with the NCF model before deploying weights |
| pnpm | 9.x | Package manager for the JS side — native workspace support for the monorepo |
| pip | Latest | Package manager for the Python side (FastAPI, PyTorch, sentence-transformers) |

---

## Data Flow

```
Browser Extension (observes)
  → Express API (receives events + scraped job data)
    → PostgreSQL/Prisma (stores)
    → Redis (caches hot match scores)
    → FastAPI/PyTorch (NCF learns & recommends)
```
