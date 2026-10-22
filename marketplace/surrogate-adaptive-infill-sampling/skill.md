# Surrogate Adaptive Infill Sampling

Spend the remaining simulation budget where it helps most by adding points through an infill criterion that balances exploring uncertain regions against refining promising ones.

## Inputs

- `weakness-map`: Regions of high surrogate error and high prediction variance
- `simulation-budget`: The remaining affordable expensive runs

## Outputs

- `infill-points`: The next expensive evaluations chosen by the infill criterion
- `updated-surrogate`: The surrogate refit after adding the infill points, with its improved error

## Process

1. Choose the infill criterion from the goal. For global accuracy, add points where the kriging prediction variance s^2(x) is largest (pure exploration); for locating an optimum, use expected improvement, which balances predicted value against uncertainty; for building a classifier boundary, add points near the predicted limit state.
2. Use expected improvement when the surrogate serves optimization. EI(x) = (y_min - y_hat(x))*Phi(z) + s(x)*phi(z) with z = (y_min - y_hat(x))/s(x), where y_min is the best observed value and Phi, phi are the standard normal CDF and PDF. The first term rewards predicted improvement, the second rewards uncertainty, so EI naturally explores and exploits.
3. Add points one or a few at a time and refit. After each infill batch, re-estimate the surrogate hyperparameters and re-run cross-validation; adaptive sampling is a loop, and a point added in a region that turns out smooth may change the fitted length scales and redirect the next point.
4. Prevent clustering and numerical breakdown. Enforce a minimum distance between new and existing points, because infill criteria can pile points on top of each other as the surrogate becomes certain, which adds ill-conditioning without new information.
5. Stop on a budget or a convergence rule. Halt when the expensive-run budget is exhausted, when the maximum expected improvement falls below a threshold, or when cross-validation error plateaus; continuing past the plateau spends runs for negligible accuracy gain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
