# Interaction Data Preparer

Collect and prepare user interaction data for the recommendation model.

## Inputs

- `interaction-logs`: Raw user interaction data (views, clicks, purchases)
- `item-catalog`: Catalog of items to recommend

## Outputs

- `interaction-matrix`: User-item interaction matrix
- `data-summary`: Summary statistics (sparsity, user/item counts)

## Process

1. Extract relevant interactions (implicit: views, clicks; explicit: ratings).
2. Filter out bots, test accounts, and low-activity users.
3. Build the user-item interaction matrix.
4. Compute sparsity, popularity distribution, and cold-start statistics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
