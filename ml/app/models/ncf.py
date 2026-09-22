"""Neural Collaborative Filtering (NeuMF): GMF + MLP, per He et al. (2017)."""

import torch
from torch import nn


class NeuMF(nn.Module):
    def __init__(self, num_users: int, num_items: int, embedding_dim: int = 8, mlp_layer_sizes: tuple[int, ...] = (16, 8)):
        super().__init__()
        self.gmf_user_embedding = nn.Embedding(num_users, embedding_dim)
        self.gmf_item_embedding = nn.Embedding(num_items, embedding_dim)
        self.mlp_user_embedding = nn.Embedding(num_users, embedding_dim)
        self.mlp_item_embedding = nn.Embedding(num_items, embedding_dim)

        mlp_blocks: list[nn.Module] = []
        input_dim = embedding_dim * 2
        for layer_size in mlp_layer_sizes:
            mlp_blocks.append(nn.Linear(input_dim, layer_size))
            mlp_blocks.append(nn.ReLU())
            input_dim = layer_size
        self.mlp = nn.Sequential(*mlp_blocks)

        self.output_layer = nn.Linear(embedding_dim + mlp_layer_sizes[-1], 1)

    def forward(self, user_idx: torch.Tensor, item_idx: torch.Tensor) -> torch.Tensor:
        gmf_vector = self.gmf_user_embedding(user_idx) * self.gmf_item_embedding(item_idx)

        mlp_input = torch.cat([self.mlp_user_embedding(user_idx), self.mlp_item_embedding(item_idx)], dim=-1)
        mlp_vector = self.mlp(mlp_input)

        combined = torch.cat([gmf_vector, mlp_vector], dim=-1)
        return torch.sigmoid(self.output_layer(combined)).squeeze(-1)
