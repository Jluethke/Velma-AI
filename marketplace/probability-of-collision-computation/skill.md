# Probability Of Collision Computation

Compute the probability of collision and test its sensitivity to covariance.

## Inputs

- `close_approach_data`: Miss vector, relative velocity, and combined covariance.
- `conjunction_list`: Events to evaluate.

## Outputs

- `collision_probability`: Probability of collision for each event.
- `pc_sensitivity`: Sensitivity of the probability to covariance and object size.

## Process

1. Combine both objects' covariances into one relative covariance and project it onto the encounter plane perpendicular to the relative velocity.
2. Set the hard-body radius as the sum of the two object radii; the collision cross-section is a circle of that radius in the encounter plane.
3. For a fast linear encounter compute the two-dimensional probability by integrating the combined Gaussian over the hard-body circle (the Foster or Chan method).
4. Watch for probability dilution: a very large covariance lowers the computed probability in a misleading way, so a near miss with poor tracking can still be dangerous.
5. Use a Monte Carlo propagation for slow or highly nonlinear encounters where the linear assumption breaks down, and track how the result moves as covariance shrinks with new tracking.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
