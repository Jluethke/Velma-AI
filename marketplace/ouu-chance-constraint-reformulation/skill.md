# Ouu Chance Constraint Reformulation

Turn probabilistic constraints into a form a solver can handle, analytically where the distribution allows and by sample approximation otherwise, so the stochastic problem becomes a deterministic surrogate.

## Inputs

- `stochastic-formulation`: The chance-constrained problem to be reformed
- `uncertainty-model`: The distributions needed to evaluate the probabilities

## Outputs

- `deterministic-reformulation`: The analytic or sample-based deterministic constraints that stand in for the chance constraints
- `reformulation-assumptions`: The distribution and independence assumptions each reformulation relies on

## Process

1. Reform a Gaussian linear chance constraint analytically. If g(x, xi) is linear in xi and xi is normal, then P(g <= 0) >= 1 - alpha becomes the deterministic constraint mu_g(x) + Phi^(-1)(1 - alpha)*sigma_g(x) <= 0, where mu_g and sigma_g are the mean and standard deviation of g and Phi^(-1) is the standard normal quantile (Phi^(-1)(0.99) = 2.326). This is exact and cheap when its assumptions hold.
2. Use the first-order reliability method for nonlinear limit states. Transform to standard normal space, find the most probable point on g = 0 nearest the origin, and relate the reliability index beta (that distance) to the probability via p_f approximately Phi(-beta); the chance constraint P(g <= 0) >= 1 - alpha becomes beta(x) >= Phi^(-1)(1 - alpha). Add the second-order correction when the limit state is strongly curved.
3. Use the sample average approximation when distributions are non-Gaussian or constraints are complex. Draw N scenarios and replace the probability with a sample fraction, enforcing g(x, xi_i) <= 0 for a required number of scenarios; the scenario count sets both accuracy and problem size, so size N from the target alpha as in a Monte Carlo study.
4. Apply a scenario or sample-discarding bound for a guarantee. Scenario-optimization theory gives the number of scenarios that guarantees the chance constraint holds with high confidence; this converts the probabilistic statement into a finite set of hard constraints with a provable reliability level, at the price of more scenarios.
5. Record which reformulation is used where and its assumptions. The analytic form assumes near-Gaussian linear behavior, the reliability method assumes a single dominant failure point, and the sample form assumes enough scenarios; a downstream reader must know which approximation produced the feasible set to judge how much the optimum can be trusted.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
