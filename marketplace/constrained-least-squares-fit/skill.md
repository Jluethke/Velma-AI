# Constrained Least-Squares Fit

Fit a function approximation by minimizing the weighted sum of squared residuals subject to the constraint set, using the selected basis functions. This is the core of function reconstruction from observations: the method of least squares applied to an unknown function.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load data, basis, constraints, regularization
REASON  --> Form design matrix, solve constrained problem
PLAN    --> Compute covariance, confidence band, check residuals
ACT     --> Output fitted function, residuals, confidence band
```

## Inputs

- `structured_pairs`: list[object] -- Input-output data with uncertainty bounds
- `basis_set`: object -- Selected basis functions from basis-function-selection
- `constraint_set`: list[object] -- Inequality and equality constraints
- `regularization_strategy`: object -- Overfitting prevention method

## Outputs

- `fitted_function`: object -- The reconstructed function as basis coefficients, valid over the observed input range
- `residual_statistics`: object -- Residual mean, variance, distribution, and consistency with measurement uncertainty
- `confidence_band`: object -- Pointwise confidence interval on the fitted function

---

## Execution

### OBSERVE: Prepare the Problem

1. Evaluate each basis function at each input data point to form the design matrix A (N observations x M basis functions).
2. Form the observation vector b from the output data.
3. Form the weight matrix W from the inverse measurement uncertainties (higher weight on more precise measurements).
4. Translate constraints into matrix form: C*x >= d for inequalities, E*x = f for equalities.

### REASON: Solve

1. **Unconstrained case:** If no active constraints, solve by weighted least squares:
   ```
   x = (A'WA + lambda*I)^(-1) * A'Wb
   ```
   where lambda is the Tikhonov regularization parameter.

2. **Constrained case:** Solve the quadratic program:
   ```
   minimize ||W^(1/2)(Ax - b)||^2 + lambda*||x||^2
   subject to: Cx >= d, Ex = f
   ```
   Use an active-set method or interior point solver.

3. **Cross-validation (if selected):** For each candidate regularization strength lambda, compute leave-one-out error. Select the lambda that minimizes validation error.

### PLAN: Assess Quality

1. **Compute residuals:** r = b - A*x. Check that residuals are zero-mean and their variance is consistent with measurement uncertainty.
2. **Systematic structure:** If residuals show a pattern (e.g., positive at low input, negative at high input), the basis is too simple. Add higher-order terms or more knots.
3. **Compute coefficient covariance:** Cov(x) = sigma^2 * (A'WA + lambda*I)^(-1) where sigma^2 is the residual variance.
4. **Derive confidence band:** At each input point x_i, the prediction variance is: A(x_i) * Cov(x) * A(x_i)'. The 95% confidence interval is prediction +/- 1.96 * sqrt(prediction_variance).
5. The confidence band widens in sparse-data regions and narrows where data is dense.

### ACT: Deliver

1. Output the fitted function: basis type, coefficients, and valid input range.
2. Output residual statistics: mean, variance, maximum, and whether they are consistent with measurement uncertainty.
3. Output the confidence band: pointwise 95% interval at representative input values.

## Exit Criteria

1. The fitted function's residuals are consistent with measurement uncertainty (no systematic structure)
2. The confidence band is computed
3. If residuals show structure, the basis inadequacy is noted with a recommendation

## Reference

The method of least squares was developed by Gauss (1809) and Legendre (1805) to determine planetary orbits from telescopic observations. The same principle applies here: given enough observations of a function's output, reconstruct the function itself, within the limits of observation accuracy and the chosen basis complexity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
