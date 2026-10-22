# Failure Demand Categorization

Group the failure demand into a small number of categories by what went wrong, and size each by volume. A handful of categories usually accounts for most of the failure demand.

## Inputs

- `failure-demand`: Items caused by earlier failures
- `failure-demand-ratio`: Failure demand share of total

## Outputs

- `failure-categories`: Failure demand grouped by what went wrong
- `category-volumes`: The volume carried by each category

## Process

1. Group failure-demand items by the thing that went wrong, not by the department that handles them.
2. Keep the number of categories small so attention stays on the heavy ones.
3. Size each category by its share of failure-demand volume.
4. Rank the categories so the largest sources of rework are obvious.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
