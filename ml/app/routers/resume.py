import base64
import binascii

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import GEMINI_API_KEY
from app.services.resume_parser import ParsedResumeProfile, parse_resume

router = APIRouter()


class ResumeParseRequest(BaseModel):
    fileBase64: str
    mimeType: str = "application/pdf"


@router.post("/resume/parse", response_model=ParsedResumeProfile)
def parse_resume_endpoint(request: ResumeParseRequest) -> ParsedResumeProfile:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured")

    try:
        file_bytes = base64.b64decode(request.fileBase64, validate=True)
    except binascii.Error:
        raise HTTPException(status_code=400, detail="fileBase64 is not valid base64") from None

    return parse_resume(file_bytes, request.mimeType)
