from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import GEMINI_API_KEY
from app.services.resume_parser import ContactHints, ParsedResumeProfile, parse_resume

router = APIRouter()


class ResumeParseRequest(BaseModel):
    resumeText: str
    email: str | None = None
    phone: str | None = None
    links: list[dict[str, str]] = []


@router.post("/resume/parse", response_model=ParsedResumeProfile)
def parse_resume_endpoint(request: ResumeParseRequest) -> ParsedResumeProfile:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured")

    if not request.resumeText.strip():
        raise HTTPException(status_code=400, detail="resumeText is empty")

    hints = ContactHints(email=request.email, phone=request.phone, links=request.links)
    return parse_resume(request.resumeText, hints)
