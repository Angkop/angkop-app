import logging

import httpx
from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError

from app.config import GEMINI_MODEL, GEMINI_MODEL_FALLBACK

logger = logging.getLogger(__name__)

_RATE_LIMIT_STATUS_CODE = 429

# Anything here is treated as "this model instance is unavailable right now" rather than
# "this request is bad" - worth retrying against a different model/quota. ServerError covers
# Gemini-side 5xx (e.g. 504 DEADLINE_EXCEEDED when a model is overloaded); the httpx errors
# cover the request never getting a response at all (connection reset, our client-side
# timeout firing) after the SDK's own internal retries are exhausted.
_TRANSIENT_ERRORS = (ClientError, ServerError, httpx.TimeoutException, httpx.ConnectError)


def _is_fallback_worthy(exc: Exception) -> bool:
    if isinstance(exc, ClientError):
        # Only a rate limit is worth retrying on a different model - any other 4xx (bad
        # request, invalid schema, etc.) will fail identically against the fallback model.
        return exc.code == _RATE_LIMIT_STATUS_CODE
    return isinstance(exc, (ServerError, httpx.TimeoutException, httpx.ConnectError))


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


def _call(
    client: genai.Client,
    model: str,
    *,
    contents: str,
    response_schema: type,
    temperature: float,
    max_output_tokens: int,
) -> str:
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=_build_config(
            model,
            response_schema=response_schema,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        ),
    )
    return response.text


def generate_content_with_fallback(
    client: genai.Client,
    *,
    contents: str,
    response_schema: type,
    temperature: float,
    max_output_tokens: int,
) -> str:
    """Calls Gemini with GEMINI_MODEL; if that model is rate-limited (429), erroring
    server-side (5xx), or simply not responding (timeout/connection failure), retries once
    against GEMINI_MODEL_FALLBACK. Any other error (bad request, invalid schema, etc.)
    propagates immediately without a fallback attempt, since the fallback model would fail
    identically."""
    try:
        return _call(
            client,
            GEMINI_MODEL,
            contents=contents,
            response_schema=response_schema,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
    except _TRANSIENT_ERRORS as exc:
        if not _is_fallback_worthy(exc) or not GEMINI_MODEL_FALLBACK or GEMINI_MODEL_FALLBACK == GEMINI_MODEL:
            raise
        logger.warning(
            "Gemini model %s failed (%s), retrying with fallback model %s",
            GEMINI_MODEL,
            type(exc).__name__,
            GEMINI_MODEL_FALLBACK,
        )
        return _call(
            client,
            GEMINI_MODEL_FALLBACK,
            contents=contents,
            response_schema=response_schema,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
