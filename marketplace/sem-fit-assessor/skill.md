# Sem Fit Assessor

Assess how well the estimated model reproduces the observed data using standard fit indices.

## Inputs

- `parameter-estimates`: Estimated parameters from the model
- `estimation-diagnostics`: Convergence and diagnostic information

## Outputs

- `fit-indices`: Chi-square, CFI, TLI, RMSEA with 90% CI, SRMR, AIC, BIC
- `fit-verdict`: Pass, marginal, or fail against conventional thresholds

## Process

1. Compute absolute fit indices: chi-square, SRMR.
2. Compute incremental fit indices: CFI, TLI against the null model.
3. Compute parsimony-corrected indices: RMSEA with confidence interval, AIC, BIC.
4. Compare each index against conventional cutoffs (CFI > 0.95, RMSEA < 0.06, SRMR < 0.08) and note marginal cases.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
