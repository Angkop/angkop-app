# Angkop ML Microservice

FastAPI service hosting Sentence-BERT embeddings, the hybrid (semantic + collaborative)
match score, and skill-gap detection. See `SETUP.md` §10 at the repo root for the
original checklist this follows.

## Setup

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/train_ncf.py   # trains the small NCF model on seed/interactions.json
uvicorn app.main:app --reload --reload-dir app --port 8000
```

Confirm it's up at `http://localhost:8000/docs`.

## Notes

- `/embed` uses real Sentence-BERT (`all-MiniLM-L6-v2`, 384-dim).
- `/recommend`'s collaborative score falls back to a neutral `0.5` for any user/job pair
  the NCF model wasn't trained on (`ml/weights/` missing, or an unseen id) — that's the
  documented cold-start behavior, not a bug.
- `/skill-gap` compares each required skill's own embedding against the user's declared
  skill embeddings (see the comment in `app/routers/skill_gap.py` for why, instead of
  literal dimension-subtraction on the raw 384-dim vectors).
- This service does not talk to Postgres or Redis directly — Express owns all
  persistence and passes whatever text/ids are needed in the request body.
