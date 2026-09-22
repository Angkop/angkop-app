import threading

import numpy as np
import torch
from sentence_transformers import SentenceTransformer

from app.config import MODEL_NAME

# FastAPI runs sync `def` route handlers in a thread pool (up to ~40 concurrent), and
# PyTorch's CPU ops are themselves internally multi-threaded. Several Python threads each
# calling .encode() at once means dozens of OS threads all fighting over the same handful
# of CPU cores — in practice this doesn't just get slow, it can make the whole process stop
# responding to anything (including unrelated endpoints like /health) for a very long time.
# Pinning torch to single-threaded ops removes the thread-oversubscription part of that;
# the lock below then serializes actual inference calls so they queue predictably instead
# of all fighting for CPU at once.
torch.set_num_threads(1)
_inference_lock = threading.Lock()

_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def get_model() -> SentenceTransformer:
    # Same thundering-herd concern as above, specifically for the one-time model load: a
    # bare lru_cache isn't thread-safe against concurrent first calls, so double-check here.
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_text(text: str) -> list[float]:
    with _inference_lock:
        embedding = get_model().encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return embedding.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    with _inference_lock:
        embeddings = get_model().encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.tolist()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    vec_a, vec_b = np.array(a), np.array(b)
    denom = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
    if denom == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / denom)
