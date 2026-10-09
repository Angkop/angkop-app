from fastapi import APIRouter
from pydantic import BaseModel

from app.config import (
    COLLABORATIVE_WEIGHT_CEILING,
    COLLABORATIVE_WEIGHT_FLOOR,
    COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION,
)
from app.services.embedder import cosine_similarity
from app.services.ncf_service import predict_collaborative_score, predict_collaborative_scores_batch

router = APIRouter()


class RecommendRequest(BaseModel):
    userId: str
    jobId: str
    userEmbedding: list[float]
    jobEmbedding: list[float]
    userInteractionCount: int


class RecommendResponse(BaseModel):
    semanticScore: float
    collaborativeScore: float
    hybridScore: float
    # How much weight the collaborative score actually carries in the hybrid blend for
    # this user — exposed so the client can show it as a concrete number (e.g. in the
    # match insight dialog) rather than just the opaque hybrid result.
    collaborativeWeight: float


class RecommendBatchJob(BaseModel):
    jobId: str
    jobEmbedding: list[float]


class RecommendBatchRequest(BaseModel):
    userId: str
    userEmbedding: list[float]
    userInteractionCount: int
    jobs: list[RecommendBatchJob]


class RecommendBatchResult(RecommendResponse):
    jobId: str


class RecommendBatchResponse(BaseModel):
    results: list[RecommendBatchResult]


def _collaborative_weight(interaction_count: int) -> float:
    weight = COLLABORATIVE_WEIGHT_FLOOR + COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION * interaction_count
    return min(weight, COLLABORATIVE_WEIGHT_CEILING)


def _hybrid(
    user_embedding: list[float], job_embedding: list[float], collaborative_score: float, interaction_count: int
) -> tuple[float, float, float]:
    # Sentence-BERT cosine similarity is typically in [0, 1] for related text but can dip
    # slightly negative for unrelated text — clamp so the score is always a clean percentage.
    semantic_score = max(0.0, cosine_similarity(user_embedding, job_embedding))
    collaborative_weight = _collaborative_weight(interaction_count)
    hybrid_score = collaborative_weight * collaborative_score + (1 - collaborative_weight) * semantic_score
    return semantic_score, collaborative_weight, hybrid_score


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest) -> RecommendResponse:
    collaborative_score = predict_collaborative_score(request.userId, request.jobId)
    semantic_score, collaborative_weight, hybrid_score = _hybrid(
        request.userEmbedding, request.jobEmbedding, collaborative_score, request.userInteractionCount
    )

    return RecommendResponse(
        semanticScore=semantic_score,
        collaborativeScore=collaborative_score,
        hybridScore=hybrid_score,
        collaborativeWeight=collaborative_weight,
    )


# Scores every job in one request instead of the job feed calling /recommend once per job —
# both the embeddings (job + user) and the NCF batch lookup below skip re-running any model
# inference per job, since the embeddings are already computed/stored and the NCF forward
# pass is batched into a single tensor op.
@router.post("/recommend/batch", response_model=RecommendBatchResponse)
def recommend_batch(request: RecommendBatchRequest) -> RecommendBatchResponse:
    job_ids = [job.jobId for job in request.jobs]
    collaborative_scores = predict_collaborative_scores_batch(request.userId, job_ids)

    results = []
    for job, collaborative_score in zip(request.jobs, collaborative_scores):
        semantic_score, collaborative_weight, hybrid_score = _hybrid(
            request.userEmbedding, job.jobEmbedding, collaborative_score, request.userInteractionCount
        )
        results.append(
            RecommendBatchResult(
                jobId=job.jobId,
                semanticScore=semantic_score,
                collaborativeScore=collaborative_score,
                hybridScore=hybrid_score,
                collaborativeWeight=collaborative_weight,
            )
        )
    return RecommendBatchResponse(results=results)
