# Angkop — Tech Stack

- **Next.js (React)** — powers the web dashboard where users view ranked matches, skill gaps, and application history.
- **Browser Extension (Manifest V3)** — reads Angkop's own job listing pages and injects the match-score overlay.
- **Node.js + Express.js** — serves the REST API for auth, profile CRUD, job tracking, and event ingestion.
- **Apollo Server (GraphQL)** — lets the dashboard query exactly the data each screen needs.
- **Python + FastAPI** — hosts the ML microservice for embeddings, ranking, and skill gap analysis.
- **Sentence-BERT (`all-MiniLM-L6-v2`)** — embeds job and user text into 768-dim vectors for semantic matching.
- **PyTorch (NCF)** — learns a collaborative-filtering score from implicit user-job interactions.
- **Gemini API** — drafts tailored cover letters and application emails for user review.
- **Gmail API** — sends an application email only after the user explicitly approves the draft.
- **PostgreSQL (Supabase) + pgvector** — stores relational data and job/user embeddings.
- **Prisma ORM** — manages schema and soft-delete-only database access.
- **Redis** — caches computed match scores and recommendation lists for 24 hours.
- **Google OAuth 2.0 (Supabase Auth / Chrome Identity API)** — authenticates users across the web app and extension with incremental consent for Gmail sending.
- **Google Colab** — trains the NCF model offline before its weights are deployed to FastAPI.
