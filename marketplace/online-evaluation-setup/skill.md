# Online Evaluation Setup

Set up online evaluation to measure real user engagement.

## Inputs

- `serving-api`: The deployed recommendation endpoint
- `offline-metrics`: Baseline offline metrics

## Outputs

- `online-experiment`: A/B test configuration for the recommender
- `recommendation-report`: Complete recommendation system report

## Process

1. Set up an A/B test comparing the new model against the current system.
2. Define online metrics (CTR, conversion rate, revenue per session, diversity).
3. Monitor for position bias and presentation effects.
4. Write the recommendation system report with offline and online results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
