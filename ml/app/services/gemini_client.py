import logging

from google import genai
from google.genai import types
from google.genai.errors import ClientError

from app.config import GEMINI_MODEL, GEMINI_MODEL_FALLBACK

logger = logging.getLogger(__name__)

_RATE_LIMIT_STATUS_CODE = 429


def _build_config(
    model: str, *, response_schema: type, temperature: float, max_output_tokens: int
) -> types.GenerateContentConfig:
    config_kwargs: dict[str, object] = {
        "response_mime_type": "application/json",
        "response_schema": response_schema,
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }
    # "Lite" models have no thinking capability to configure - passing thinking_config to
    # one is a 400 INVALID_ARGUMENT, confirmed live against the current Gemini API.
    if "lite" not in model:
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
    return types.GenerateContentConfig(**config_kwargs)


def generate_content_with_fallback(
    client: genai.Client,
    *,
    contents: str,
    response_schema: type,
    temperature: float,
    max_output_tokens: int,
) -> str:
    """Calls Gemini with GEMINI_MODEL; if that model is rate-limited (429), retries once
    against GEMINI_MODEL_FALLBACK. Any other error (bad request, server error, etc.)
    propagates immediately without a fallback attempt, matching prior behavior."""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=_build_config(
                GEMINI_MODEL,
                response_schema=response_schema,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            ),
        )
        return response.text
    except ClientError as exc:
        if exc.code != _RATE_LIMIT_STATUS_CODE or not GEMINI_MODEL_FALLBACK or GEMINI_MODEL_FALLBACK == GEMINI_MODEL:
            raise
        logger.warning(
            "Gemini model %s hit its rate limit, retrying with fallback model %s",
            GEMINI_MODEL,
            GEMINI_MODEL_FALLBACK,
        )
        response = client.models.generate_content(
            model=GEMINI_MODEL_FALLBACK,
            contents=contents,
            config=_build_config(
                GEMINI_MODEL_FALLBACK,
                response_schema=response_schema,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            ),
        )
        return response.text
