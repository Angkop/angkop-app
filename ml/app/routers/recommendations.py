from fastapi import APIRouter
from pydantic import BaseModel

from app.config import (
    COLLABORATIVE_WEIGHT_CEILING,
    COLLABORATIVE_WEIGHT_FLOOR,
    COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION,
)
from app.services.embedder import cosine_similarity, embed_text
from app.services.ncf_service import predict_collaborative_score

router = APIRouter()


class RecommendRequest(BaseModel):
    userId: str
    jobId: str
    userSkillsText: str
    jobText: str
    userInteractionCount: int


class RecommendResponse(BaseModel):
    semanticScore: float
    collaborativeScore: float
    hybridScore: float
    # How much weight the collaborative score actually carries in the hybrid blend for
    # this user — exposed so the client can show it as a concrete number (e.g. in the
    # match insight dialog) rather than just the opaque hybrid result.
    collaborativeWeight: float


def _collaborative_weight(interaction_count: int) -> float:
    weight = COLLABORATIVE_WEIGHT_FLOOR + COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION * interaction_count
    return min(weight, COLLABORATIVE_WEIGHT_CEILING)


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest) -> RecommendResponse:
    user_embedding = embed_text(request.userSkillsText)
    job_embedding = embed_text(request.jobText)
    # Sentence-BERT cosine similarity is typically in [0, 1] for related text but can dip
    # slightly negative for unrelated text — clamp so the score is always a clean percentage.
    semantic_score = max(0.0, cosine_similarity(user_embedding, job_embedding))

    collaborative_score = predict_collaborative_score(request.userId, request.jobId)

    collaborative_weight = _collaborative_weight(request.userInteractionCount)
    hybrid_score = collaborative_weight * collaborative_score + (1 - collaborative_weight) * semantic_score

    return RecommendResponse(
        semanticScore=semantic_score,
        collaborativeScore=collaborative_score,
        hybridScore=hybrid_score,
        collaborativeWeight=collaborative_weight,
    )
