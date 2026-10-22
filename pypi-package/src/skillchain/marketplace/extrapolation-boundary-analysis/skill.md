# Extrapolation Boundary Analysis

Assess the reconstructed function's reliability outside the observed input range. Identify where extrapolation is safe (confidence band stays within known constraints) and where the model's predictions diverge beyond acceptable uncertainty.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load fitted function, confidence band, constraints
REASON  --> Evaluate beyond observed range, check constraints
PLAN    --> Find divergence points, compute divergence rate
ACT     --> Output extrapolation limits and constraint violations
```

## Inputs

- `fitted_function`: object -- The reconstructed function from constrained-least-squares-fit
- `confidence_band`: object -- Confidence interval on the fit
- `constraint_set`: list[object] -- Known constraints that apply beyond the observed range

## Outputs

- `extrapolation_limits`: object -- The input range beyond which extrapolation is unreliable: per direction (above and below the observed range), the limit and the divergence rate
- `constraint_violations`: list[object] -- Points where extrapolation violates known constraints, indicating model breakdown

---

## Execution

### OBSERVE: Extend the Evaluation

1. Evaluate the fitted function at input values beyond the observed range: extend 10%, 20%, 50%, and 100% beyond the min and max observed inputs.
2. Evaluate the confidence band at the same extended points. The band widens as distance from the data increases.

### REASON: Check Constraints

1. At each extended point, check whether the predicted value and its confidence band satisfy all known constraints:
   - Does the predicted value stay within physical bounds?
   - Does the predicted derivative satisfy monotonicity constraints?
   - Does the predicted rate of change stay within rate limits?

2. The extrapolation is reliable as far as the ENTIRE confidence band (not just the center prediction) stays within all constraints. The moment the upper or lower bound violates a constraint, the model is speculating.

3. Compute the divergence rate: how fast the confidence band width grows per unit of extrapolation. Polynomial bases diverge fastest (exponential growth). Splines with zero extrapolation slope diverge slowest.

### PLAN: Define Limits

1. For each direction (above and below the observed range):
   - Find the input value where the confidence band first touches a constraint boundary. This is the extrapolation limit.
   - If no constraint is violated within 100% extension, note the model as "cautiously extrapolable" with the caveat that unmeasured nonlinearities may appear.

2. For each constraint violation:
   - Which constraint is violated?
   - At what input value?
   - By how much?
   - What additional observation would push the reliable range outward?

### ACT: Deliver

1. Output extrapolation limits: safe range above and below the observed data, with confidence.
2. Output constraint violations: where the model fails, which constraint, and the observation needed to fix it.
3. The key message: the reconstructed function is trustworthy inside the observed range and within the extrapolation limits, and speculative beyond.

## Exit Criteria

1. Extrapolation limits are defined for both directions
2. Constraint violations are cataloged
3. The divergence rate is computed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
