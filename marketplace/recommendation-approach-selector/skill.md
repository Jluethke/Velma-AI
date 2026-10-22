# Recommendation Approach Selector

Select the recommendation approach based on data characteristics.

## Inputs

- `interaction-matrix`: User-item interaction data
- `data-summary`: Data characteristics and constraints

## Outputs

- `selected-approach`: Chosen approach (collaborative, content, hybrid)
- `approach-rationale`: Why this approach fits the data

## Process

1. Evaluate collaborative filtering feasibility (density, user overlap).
2. Assess content-based feasibility (item feature availability).
3. Consider hybrid approaches for cold-start mitigation.
4. Document the approach selection rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
