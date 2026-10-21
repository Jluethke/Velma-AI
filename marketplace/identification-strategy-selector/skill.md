# Identification Strategy Selector

Select the causal identification strategy (adjustment, IV, DiD, RDD, propensity score) based on the DAG and data characteristics.

## Inputs

- `causal-dag`: the DAG encoding assumptions
- `variable-roles`: classified variable roles

## Outputs

- `identification-strategy`: selected method with specification details
- `identifying-assumptions`: explicit list of assumptions required for causal identification

## Process

1. Apply the backdoor criterion to find an adjustment set that blocks all confounding paths
2. If no valid adjustment set exists, check for instrumental variables (front-door or IV criteria)
3. Evaluate difference-in-differences or regression discontinuity if the design supports them
4. Document every identifying assumption (no unmeasured confounding, exclusion restriction, parallel trends, etc.)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
