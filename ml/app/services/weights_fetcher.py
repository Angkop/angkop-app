from pathlib import Path

import httpx

from app.config import (
    NCF_ID_MAPPING_PATH,
    NCF_WEIGHTS_BUCKET,
    NCF_WEIGHTS_PATH,
    SUPABASE_SERVICE_KEY,
    SUPABASE_URL,
)

# Weights + their id mapping are generated together by the same training run (the mapping
# is the user/item index the weights were trained against), so they're always fetched as a
# pair from the same bucket rather than one committed to git and one fetched.
_REMOTE_OBJECTS = {
    NCF_WEIGHTS_PATH: "ncf.pt",
    NCF_ID_MAPPING_PATH: "id_mappings.json",
}


def fetch_ncf_weights() -> None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return

    for local_path, object_name in _REMOTE_OBJECTS.items():
        destination = Path(local_path)
        if destination.exists():
            continue

        url = f"{SUPABASE_URL}/storage/v1/object/{NCF_WEIGHTS_BUCKET}/{object_name}"
        headers = {"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
        response = httpx.get(url, headers=headers, timeout=30)
        # A failed fetch is not fatal — ncf_service.py already falls back to a neutral
        # cold-start score when the weights file is absent.
        if response.status_code != 200:
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(response.content)
