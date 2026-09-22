"""Trains a small NeuMF model on the seed interaction data so /recommend has a real
(if intentionally small) collaborative signal to demo, instead of only cold-start
neutral scores. Mirrors the thesis's documented workflow: NCF is trained offline, then
the FastAPI service loads the resulting weights.

Run from the ml/ directory (with the venv active):
    python scripts/train_ncf.py
"""

import json
import random
import sys
from pathlib import Path

import torch
from torch import nn, optim

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.models.ncf import NeuMF  # noqa: E402

SEED_DIR = Path(__file__).resolve().parent.parent.parent / "seed"
WEIGHTS_DIR = Path(__file__).resolve().parent.parent / "weights"

EMBEDDING_DIM = 8
MLP_LAYER_SIZES = (16, 8)
EPOCHS = 300
LEARNING_RATE = 0.01
NEGATIVE_SAMPLES_PER_POSITIVE = 1


def normalize_weight(weight: float) -> float:
    # Interaction weights: apply=5, save=3, view=1, dismiss=-2 -> squash to a [0, 1] label
    return max(0.0, min(1.0, (weight + 2) / 7))


def main() -> None:
    users = json.loads((SEED_DIR / "users.json").read_text())
    jobs = json.loads((SEED_DIR / "jobs.json").read_text())
    interactions = json.loads((SEED_DIR / "interactions.json").read_text())

    user_index = {user["id"]: i for i, user in enumerate(users)}
    item_index = {job["id"]: i for i, job in enumerate(jobs)}

    positive_pairs = [
        (user_index[i["userId"]], item_index[i["jobId"]], normalize_weight(i["weight"]))
        for i in interactions
        if i["userId"] in user_index and i["jobId"] in item_index
    ]

    observed = {(u, j) for u, j, _ in positive_pairs}
    negative_pairs: list[tuple[int, int, float]] = []
    all_user_indices = list(user_index.values())
    all_item_indices = list(item_index.values())
    random.seed(42)
    while len(negative_pairs) < len(positive_pairs) * NEGATIVE_SAMPLES_PER_POSITIVE:
        u = random.choice(all_user_indices)
        j = random.choice(all_item_indices)
        if (u, j) not in observed:
            negative_pairs.append((u, j, 0.0))

    all_pairs = positive_pairs + negative_pairs
    random.shuffle(all_pairs)

    user_tensor = torch.tensor([p[0] for p in all_pairs])
    item_tensor = torch.tensor([p[1] for p in all_pairs])
    label_tensor = torch.tensor([p[2] for p in all_pairs], dtype=torch.float32)

    model = NeuMF(
        num_users=len(users),
        num_items=len(jobs),
        embedding_dim=EMBEDDING_DIM,
        mlp_layer_sizes=MLP_LAYER_SIZES,
    )
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    loss_fn = nn.BCELoss()

    model.train()
    for epoch in range(EPOCHS):
        optimizer.zero_grad()
        predictions = model(user_tensor, item_tensor)
        loss = loss_fn(predictions, label_tensor)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 50 == 0:
            print(f"epoch {epoch + 1}/{EPOCHS} — loss {loss.item():.4f}")

    WEIGHTS_DIR.mkdir(exist_ok=True)
    torch.save(model.state_dict(), WEIGHTS_DIR / "ncf.pt")
    (WEIGHTS_DIR / "id_mappings.json").write_text(
        json.dumps(
            {
                "userIndex": user_index,
                "itemIndex": item_index,
                "numUsers": len(users),
                "numItems": len(jobs),
                "embeddingDim": EMBEDDING_DIM,
                "mlpLayerSizes": list(MLP_LAYER_SIZES),
            },
            indent=2,
        )
    )
    print(f"Trained on {len(positive_pairs)} positive + {len(negative_pairs)} negative interactions.")
    print(f"Saved weights to {WEIGHTS_DIR / 'ncf.pt'}")


if __name__ == "__main__":
    main()
