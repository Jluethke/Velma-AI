# Parameter Estimation

Estimate model parameters for each candidate structure using least-squares regression, subspace identification, or prediction error minimization. Produce fitted models with covariance estimates and residual analysis.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load conditioned data and candidate structures
REASON  --> Form regression matrices, solve for parameters
PLAN    --> Analyze residuals, test whiteness
ACT     --> Output fitted models and residual analysis
```

## Inputs

- `conditioned_data`: object -- Input-output data from response-data-conditioning
- `candidate_structures`: list[object] -- Model structures to fit, from model-structure-selection
- `order_estimates`: object -- System order estimates

## Outputs

- `fitted_models`: list[object] -- Each candidate structure with: estimated parameters, parameter covariance matrix, fit percentage, and AIC/BIC scores
- `residual_analysis`: object -- Per-model residual statistics: mean, variance, whiteness test result, cross-correlation with input

---

## Execution

### OBSERVE: Prepare for Estimation

1. Split conditioned data into identification set (70%) and validation set (30%). Use a time-based split (first 70% for identification, last 30% for validation) to preserve temporal structure.
2. For each candidate structure, determine the regression matrix dimensions based on estimated order and number of input/output channels.

### REASON: Fit Parameters

1. **ARX models.** Form the regression matrix Phi from lagged inputs and outputs:
   ```
   y(t) = a1*y(t-1) + ... + an*y(t-n) + b0*u(t-d) + ... + bm*u(t-d-m) + e(t)
   ```
   Solve by ordinary least squares: theta = (Phi'Phi)^(-1) Phi'y. Compute parameter covariance from the residual variance and (Phi'Phi)^(-1).

2. **State-space models.** Apply subspace identification (N4SID):
   - Construct the block Hankel matrices from input-output data
   - Compute the SVD of the weighted oblique projection
   - Extract A, B, C, D matrices from the column space
   - Refine with prediction error minimization if needed

3. **Nonlinear models.** Use iterative prediction error minimization:
   - Initialize with a linearized estimate
   - Minimize sum of squared prediction errors using Gauss-Newton or Levenberg-Marquardt
   - Track convergence; abort if not converging after 100 iterations

4. **Compute fit metrics.** For each fitted model:
   - Fit percentage: `100 * (1 - norm(residual) / norm(output - mean(output)))`
   - AIC: `n * log(residual_variance) + 2*k` where k = number of parameters
   - BIC: `n * log(residual_variance) + k*log(n)`

### PLAN: Analyze Residuals

1. **Whiteness test.** Compute the autocorrelation of residuals. White residuals (no autocorrelation beyond lag 0) mean the model captured all deterministic dynamics.
2. **Input independence test.** Compute cross-correlation between residuals and input. Significant correlation means the model missed an input-output relationship.
3. **Normality test.** Check if residuals are approximately normally distributed. Non-normal residuals may indicate outliers or model structure mismatch.
4. If residuals show structure, the model needs higher order or a different structure. Note which structure to try next.

### ACT: Deliver

1. Output each fitted model with parameters, covariance, fit percentage, AIC, BIC.
2. Output residual analysis: whiteness test (pass/fail), input independence (pass/fail), residual variance, recommended next steps if residuals show structure.

## Exit Criteria

1. At least one model achieves fit percentage > 70% on the identification set
2. Residual analysis is complete for all fitted models
3. If no model passes the whiteness test, the best fit is still reported with the caveat

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
