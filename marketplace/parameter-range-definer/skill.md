# Parameter Range Definer

Define probability distributions or ranges for each parameter to sample during the sensitivity analysis.

## Inputs

- `parameter-catalog`: Parameters with plausible ranges
- `selected-sa-method`: Method determining the distribution requirements

## Outputs

- `parameter-distributions`: Distribution type and parameters for each model parameter
- `sample-matrix`: Matrix of parameter combinations to evaluate

## Process

1. Assign a distribution to each parameter (uniform, normal, log-normal, or triangular).
2. Generate the sample matrix using the method's sampling scheme.
3. Verify the sample matrix covers the defined ranges adequately.
4. Check for correlations between parameters that need to be preserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
