# Mc Variance Reduction Selection

Cut the number of samples needed by choosing a variance-reduction technique matched to the problem structure, so the same precision is reached at a fraction of the cost.

## Inputs

- `required-sample-size`: The plain Monte Carlo sample size to be reduced
- `system-model`: Structure of the model that a variance-reduction method can exploit

## Outputs

- `variance-reduction-method`: The chosen technique (importance sampling, stratified, antithetic, control variates) with its applicability
- `reduced-estimator`: The modified estimator and the expected variance-reduction factor

## Process

1. Use antithetic variates for smooth, roughly monotone responses. Draw paired samples using u and its mirror 1 - u on each uniform input; the negative correlation between the pair reduces the variance of their average when the output responds monotonically to the inputs, at essentially no extra cost.
2. Use control variates when a cheap correlated quantity with a known mean exists. Form the estimator Y = f - c*(g - E[g]) where g is the control with known mean E[g]; the variance-minimizing coefficient is c = Cov(f, g)/Var(g), and the resulting variance is reduced by the factor (1 - rho^2) where rho is the correlation between f and g. A control correlated at rho = 0.9 cuts variance about fivefold.
3. Use stratified sampling to remove between-stratum variance. Partition the input space into strata, sample a fixed count in each, and combine with stratum weights; this guarantees coverage of each region and removes the variance that plain random sampling spends on uneven coverage, helping most when the output varies strongly between strata.
4. Use importance sampling for rare events and heavy tails. Sample from a biasing distribution q concentrated where the integrand matters and correct with the likelihood ratio: the estimator becomes (1/N)*sum f(x_i)*p(x_i)/q(x_i) with x_i drawn from q. The variance-optimal q is proportional to |f|*p; a well-chosen q can turn an infeasible 1e8-sample rare-event problem into a few thousand samples.
5. Match method to structure and check the correction. Antithetic and stratified need no model insight; control variates need a correlated cheap surrogate; importance sampling needs knowledge of where the action is and a biasing density with heavier tails than the target, or the likelihood ratio blows up and variance gets worse, not better.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
