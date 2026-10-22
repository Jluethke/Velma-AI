# Mc Rare Event Estimation

Estimate small failure probabilities in the 1e-4 to 1e-6 range where plain Monte Carlo is infeasible, using subset simulation or importance sampling built on the design point.

## Inputs

- `output-functional`: The rare-event probability to be estimated, P(g(X) <= 0)
- `variance-reduction-method`: The biasing or decomposition strategy carried in from method selection

## Outputs

- `rare-event-probability`: The estimated small probability with its coefficient of variation
- `rare-event-validation`: The check that the biasing or conditioning did not bias the estimate

## Process

1. Recognize when plain Monte Carlo fails. Estimating p = 1e-6 to a 10 percent coefficient of variation needs on the order of 1e8 model runs; when each run is a finite element or CFD solve, that is impossible, so a rare-event method is mandatory rather than optional.
2. Use subset simulation to decompose a rare event into a product of moderate conditional probabilities. Define nested failure regions F_1 superset F_2 superset ... superset F_m = F with intermediate thresholds chosen so each conditional probability P(F_i | F_(i-1)) is about 0.1; then p_f = product of those conditionals, and each factor is estimated with a manageable sample by Markov chain Monte Carlo seeded from the previous level.
3. Use importance sampling centered on the design point for structural reliability. Find the most probable failure point (the design point) by solving for the point on the limit state g = 0 nearest the origin in standard normal space; center the biasing density there so samples land in the failure region, and correct with the likelihood ratio.
4. Report the coefficient of variation of the rare estimate, because it can be large even when the method runs. Subset simulation typically achieves a CoV of 0.1 to 0.3 for p around 1e-6 with a few thousand runs per level; a CoV that balloons signals a poorly chosen intermediate-threshold spacing or a multimodal failure region the single design point missed.
5. Validate against an independent method or a crude bound. Cross-check the subset-simulation probability with a first-order reliability estimate from the design-point distance (p_f approximately Phi(-beta) where beta is the reliability index), and confirm the two agree in order of magnitude; a large disagreement usually means multiple failure modes that one design point cannot represent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
