# Surrogate Doe Sampling Plan

Lay out where to sample the expensive model so the surrogate sees the whole input space, using a space-filling design sized to the dimension and the model class.

## Inputs

- `input-space`: The design variables with their ranges and any constraints
- `simulation-budget`: How many expensive runs are affordable for building and testing the surrogate

## Outputs

- `sampling-plan`: The set of input points to evaluate, with the design type and point count
- `design-rationale`: Why the chosen design and size fit the dimension and the intended model class

## Process

1. Pick a space-filling design for a general nonlinear response. Latin hypercube sampling stratifies each input into N equal-probability bins and places exactly one point per bin per dimension, giving good one-dimensional projection coverage; an optimized Latin hypercube (maximin or minimum-correlation) further spreads points so no large region is left unsampled.
2. Use a factorial design only for screening or low dimension. A full two-level factorial needs 2^d runs and a three-level needs 3^d, which explodes with dimension; a fractional factorial screens main effects cheaply but cannot fit curvature. These suit identifying which variables matter, not building an accurate response surface in many dimensions.
3. Size the initial design to the dimension. A common heuristic is about 10 points per input dimension for a Gaussian-process surrogate; a quadratic response surface needs at least (d + 1)*(d + 2)/2 points to determine its coefficients, so a 5-variable quadratic needs 21 at minimum and more for a stable fit.
4. Reserve part of the budget for testing. Split the affordable runs into an initial build set, an adaptive-infill reserve (the next steps spend it), and an independent test set the surrogate never sees during fitting; a surrogate validated only on its training points reports a falsely low error.
5. Respect constraints and variable types. Project or reject samples that violate input constraints, and handle categorical or integer variables explicitly rather than treating them as continuous; a design that places points in infeasible regions wastes expensive runs the budget cannot spare.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
