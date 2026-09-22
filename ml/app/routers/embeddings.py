from fastapi import APIRouter
from pydantic import BaseModel

from app.services.embedder import embed_text

router = APIRouter()


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


@router.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest) -> EmbedResponse:
    return EmbedResponse(embedding=embed_text(request.text))
