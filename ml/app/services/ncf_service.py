import json
import threading
from pathlib import Path

import torch

from app.config import (
    COLD_START_COLLABORATIVE_SCORE,
    NCF_ID_MAPPING_PATH,
    NCF_WEIGHTS_PATH,
)
from app.models.ncf import NeuMF


class LoadedNCF:
    def __init__(self, model: NeuMF, user_index: dict[str, int], item_index: dict[str, int]):
        self.model = model
        self.user_index = user_index
        self.item_index = item_index


_loaded: LoadedNCF | None = None
_load_attempted = False
_load_lock = threading.Lock()
_inference_lock = threading.Lock()


def _load() -> LoadedNCF | None:
    # Same thundering-herd concern as app/services/embedder.py: concurrent requests on a
    # cold cache would otherwise each independently read and construct the model.
    global _loaded, _load_attempted
    if _load_attempted:
        return _loaded

    with _load_lock:
        if _load_attempted:
            return _loaded

        weights_path = Path(NCF_WEIGHTS_PATH)
        mapping_path = Path(NCF_ID_MAPPING_PATH)
        if weights_path.exists() and mapping_path.exists():
            mappings = json.loads(mapping_path.read_text())
            model = NeuMF(
                num_users=mappings["numUsers"],
                num_items=mappings["numItems"],
                embedding_dim=mappings["embeddingDim"],
                mlp_layer_sizes=tuple(mappings["mlpLayerSizes"]),
            )
            model.load_state_dict(torch.load(weights_path, map_location="cpu"))
            model.eval()
            _loaded = LoadedNCF(model=model, user_index=mappings["userIndex"], item_index=mappings["itemIndex"])

        _load_attempted = True
        return _loaded


def predict_collaborative_score(user_id: str, job_id: str) -> float:
    """Cold start (untrained weights, or an id the model has never seen) returns a
    neutral score rather than a fabricated confident one — this is expected behavior
    for a new user/job pair, not a bug."""
    loaded = _load()
    if loaded is None or user_id not in loaded.user_index or job_id not in loaded.item_index:
        return COLD_START_COLLABORATIVE_SCORE

    user_idx = torch.tensor([loaded.user_index[user_id]])
    item_idx = torch.tensor([loaded.item_index[job_id]])
    with _inference_lock, torch.no_grad():
        score = loaded.model(user_idx, item_idx).item()
    return score


def predict_collaborative_scores_batch(user_id: str, job_ids: list[str]) -> list[float]:
    """Batched counterpart to predict_collaborative_score: one tensor forward pass for the
    whole list instead of one Python call (plus a lock acquisition) per job, which is what
    made scoring a full job feed slow."""
    loaded = _load()
    if loaded is None or user_id not in loaded.user_index:
        return [COLD_START_COLLABORATIVE_SCORE] * len(job_ids)

    known_job_ids = [job_id for job_id in job_ids if job_id in loaded.item_index]
    if not known_job_ids:
        return [COLD_START_COLLABORATIVE_SCORE] * len(job_ids)

    user_idx = torch.tensor([loaded.user_index[user_id]] * len(known_job_ids))
    item_idx = torch.tensor([loaded.item_index[job_id] for job_id in known_job_ids])
    with _inference_lock, torch.no_grad():
        scores = loaded.model(user_idx, item_idx).tolist()

    scores_by_job_id = dict(zip(known_job_ids, scores))
    return [scores_by_job_id.get(job_id, COLD_START_COLLABORATIVE_SCORE) for job_id in job_ids]
