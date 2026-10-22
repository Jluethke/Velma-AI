# Basis Function Selection

Select the basis functions for approximating an unknown function from observations. Choose between polynomials, splines, radial basis functions, or piecewise-linear based on observed smoothness, constraint compatibility, and data density.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load structured data and constraints
REASON  --> Assess smoothness, transitions, constraint compatibility
PLAN    --> Select basis and regularization strategy
ACT     --> Output basis set and regularization plan
```

## Inputs

- `structured_pairs`: list[object] -- Input-output data with uncertainty and region labels
- `constraint_set`: list[object] -- Mathematical constraints the approximation must satisfy

## Outputs

- `basis_set`: object -- Selected basis functions with: type, parameters (degree, knot spacing, kernel width), and rationale
- `regularization_strategy`: object -- How to prevent overfitting: Tikhonov (ridge) penalty, cross-validation for complexity, or constraint-based regularization

---

## Execution

### OBSERVE: Assess Smoothness

1. Compute finite differences of the output with respect to the input. Check consistency with different model classes:
   - Constant finite differences: polynomial
   - Varying but smooth finite differences: spline
   - Discontinuous finite differences: piecewise-linear
   - Oscillatory finite differences: trigonometric or radial basis

2. If the data has distinct operating modes with different behavior in each, piecewise models are preferred.

### REASON: Match Basis to Data

1. **Polynomial:** Good for smooth, globally similar data. Degree = number of inflection points + 1. Risk: oscillation at boundaries (Runge's phenomenon) for degree > 5.
2. **Spline (B-spline, cubic):** Good for locally smooth data with varying curvature. Knot spacing should match data density. Handles constraints well.
3. **Radial basis functions:** Good for scattered data in multiple dimensions. Kernel width should match the typical inter-point spacing.
4. **Piecewise-linear:** Good for data with sharp transitions or saturation. Each piece is a straight line; breakpoints are at observed transitions.

### PLAN: Select Regularization

1. **Sparse data (< 20 points per region):** Use Tikhonov (ridge) regularization to penalize large coefficients and prevent overfitting.
2. **Dense data (> 50 points per region):** Use cross-validation (leave-one-out or k-fold) to select complexity automatically.
3. **Constrained:** If the constraint set is strong enough to prevent overfitting on its own (e.g., monotonicity + bounded derivative), minimal additional regularization is needed.

### ACT: Deliver

1. Output the selected basis with parameters and rationale.
2. Output the regularization strategy with tuning guidance.
3. If multiple bases are viable, rank them by simplicity and recommend starting with the simplest.

## Exit Criteria

1. A basis is selected with rationale tied to observed data characteristics
2. A regularization strategy is defined
3. Constraint compatibility is verified

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
