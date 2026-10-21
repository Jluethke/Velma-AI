# Parameter Influence Ranker

Compute sensitivity indices and rank parameters by their influence on the model output.

## Inputs

- `model-outputs`: Output values from all sample points
- `sample-matrix`: Corresponding parameter combinations
- `selected-sa-method`: Method determining the index computation

## Outputs

- `sensitivity-indices`: First-order and total-effect indices (or Morris mu* and sigma) for each parameter
- `influence-ranking`: Parameters ranked from most to least influential

## Process

1. Compute the method-specific sensitivity indices for each parameter.
2. Rank parameters by their first-order (or mu*) index.
3. Identify parameters with negligible influence that could be fixed at nominal values.
4. Report the total variance explained by first-order effects vs. interactions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
