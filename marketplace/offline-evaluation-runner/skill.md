# Offline Evaluation Runner

Evaluate the model with offline metrics.

## Inputs

- `trained-recommender`: The trained model
- `interaction-matrix`: Held-out test interactions

## Outputs

- `offline-metrics`: Precision@k, NDCG, MAP, recall@k
- `coverage-analysis`: Item coverage and popularity bias analysis

## Process

1. Compute ranking metrics: precision@k, recall@k, NDCG, MAP.
2. Measure item coverage (what fraction of items get recommended).
3. Analyze popularity bias (does the model only recommend popular items).
4. Compare against baseline (most popular, random).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
