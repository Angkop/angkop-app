from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import GEMINI_API_KEY
from app.services.match_insight import MatchInsightResult, generate_match_insight

router = APIRouter()


class MatchInsightRequest(BaseModel):
    jobTitle: str
    jobCompany: str
    jobDescription: str
    jobRequiredSkills: list[str]
    userSkillsText: str
    semanticScore: float
    collaborativeScore: float
    hybridScore: float


@router.post("/insight/explain", response_model=MatchInsightResult)
def explain_match(request: MatchInsightRequest) -> MatchInsightResult:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured")

    return generate_match_insight(
        job_title=request.jobTitle,
        job_company=request.jobCompany,
        job_description=request.jobDescription,
        job_required_skills=request.jobRequiredSkills,
        user_skills_text=request.userSkillsText,
        semantic_score=request.semanticScore,
        collaborative_score=request.collaborativeScore,
        hybrid_score=request.hybridScore,
    )
