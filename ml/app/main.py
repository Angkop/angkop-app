from fastapi import FastAPI

from app.routers import embeddings, recommendations, skill_gap
from app.services.embedder import embed_text

app = FastAPI(title="Angkop ML Microservice", version="0.1.0")

app.include_router(embeddings.router, tags=["embeddings"])
app.include_router(recommendations.router, tags=["recommendations"])
app.include_router(skill_gap.router, tags=["skill-gap"])


@app.on_event("startup")
def warm_up_model() -> None:
    # Loads Sentence-BERT once at boot instead of on the first real request — otherwise
    # the first batch of concurrent requests (e.g. the dashboard's job feed, which fans
    # out one call per job) all arrive during that multi-second cold load at once.
    embed_text("warm up")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
