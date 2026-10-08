from fastapi import APIRouter
from pydantic import BaseModel

from app.config import SKILL_GAP_SIMILARITY_THRESHOLD
from app.data.course_index import courses_for_skill
from app.services.embedder import cosine_similarity, embed_texts

router = APIRouter()


class SkillGapRequest(BaseModel):
    userSkills: list[str]
    jobRequiredSkills: list[str]


class Course(BaseModel):
    title: str
    provider: str
    url: str
    thumbnail: str | None = None
    description: str | None = None


class SkillGap(BaseModel):
    skill: str
    confidence: float
    courses: list[Course]


class SkillGapResponse(BaseModel):
    missingSkills: list[SkillGap]


@router.post("/skill-gap", response_model=SkillGapResponse)
def skill_gap(request: SkillGapRequest) -> SkillGapResponse:
    """Rather than literal top-k dimensions of (job_embedding - user_embedding) — not
    meaningful for generic, unlabeled 384-dim Sentence-BERT output — this compares each
    required skill's own embedding against the user's skill embeddings directly. Still a
    genuine vector-based comparison, just one that produces sensible results."""
    if not request.jobRequiredSkills:
        return SkillGapResponse(missingSkills=[])

    required_embeddings = embed_texts(request.jobRequiredSkills)
    user_embeddings = embed_texts(request.userSkills) if request.userSkills else []

    missing: list[SkillGap] = []
    for skill, skill_embedding in zip(request.jobRequiredSkills, required_embeddings):
        best_similarity = 0.0
        for user_embedding in user_embeddings:
            best_similarity = max(best_similarity, cosine_similarity(skill_embedding, user_embedding))

        if best_similarity < SKILL_GAP_SIMILARITY_THRESHOLD:
            missing.append(
                SkillGap(
                    skill=skill,
                    confidence=round(1 - best_similarity, 4),
                    courses=[Course(**course) for course in courses_for_skill(skill)],
                )
            )

    missing.sort(key=lambda gap: gap.confidence, reverse=True)
    return SkillGapResponse(missingSkills=missing)
