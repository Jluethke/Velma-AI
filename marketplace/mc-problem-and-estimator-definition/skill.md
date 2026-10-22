# Mc Problem And Estimator Definition

Define the random inputs, the output functional, and the specific estimator the study computes, because a Monte Carlo run with an undefined estimator produces numbers without meaning.

## Inputs

- `system-model`: The deterministic model that maps inputs to the output of interest
- `uncertain-inputs`: The input variables treated as random, with their distributions and correlations

## Outputs

- `output-functional`: The scalar the study estimates (a mean, a quantile, a probability of exceedance)
- `estimator-definition`: The sample estimator formula for that functional and the quantity whose error will be controlled

## Process

1. State the random inputs with distributions, not point values. Assign each uncertain input a distribution (normal, lognormal, uniform, Weibull) fit from data or physics, and capture correlations through a correlation matrix or a copula; treating correlated inputs as independent can badly bias tail estimates.
2. Define the output functional precisely. Decide whether the target is the mean E[f(X)], a quantile such as the 95th percentile, a variance, or a probability of failure P(g(X) <= 0). The estimator, sample size, and variance-reduction choice all depend on which of these it is.
3. Write the estimator for the chosen functional. For a mean the estimator is the sample average mu_hat = (1/N)*sum f(x_i); for a probability it is the sample fraction p_hat = (1/N)*sum I[g(x_i) <= 0], where I is the indicator function; for a quantile it is the order statistic of the sample.
4. Separate aleatory from epistemic uncertainty. Aleatory (irreducible, inherent randomness) is what Monte Carlo samples; epistemic (lack of knowledge, for example an uncertain distribution parameter) is often handled by an outer loop or interval, and conflating the two understates or overstates the reported uncertainty.
5. Confirm the model is deterministic and repeatable given a fixed input vector and seed. Monte Carlo error analysis assumes each sample is an independent draw of the same mapping; hidden internal randomness or non-repeatability breaks the confidence-interval math that justifies the whole study.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
