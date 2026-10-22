# Recommendation Model Trainer

Train the recommendation model.

## Inputs

- `interaction-matrix`: User-item interaction data
- `selected-approach`: The chosen approach

## Outputs

- `trained-recommender`: The trained recommendation model
- `training-log`: Training metrics and convergence log

## Process

1. Split data by time (train on older, evaluate on newer interactions).
2. Train the model (matrix factorization, neural CF, two-tower, or content-based).
3. Tune hyperparameters (embedding size, learning rate, regularization).
4. Save the trained model and user/item embeddings.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
