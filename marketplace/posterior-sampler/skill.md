# Posterior Sampler

Select and run the sampling method (MCMC: NUTS/HMC, Gibbs; or variational inference) to approximate the posterior.

## Inputs

- `generative-model`: complete probabilistic model
- `observed-data`: the dataset

## Outputs

- `posterior-samples`: draws from the posterior distribution for each parameter
- `sampling-metadata`: number of chains, warmup, iterations, sampler diagnostics

## Process

1. Select the sampling algorithm (NUTS for continuous, Gibbs for conjugate, VI for speed at the cost of accuracy)
2. Set the number of chains (at least 4), warmup iterations, and total draws
3. Run the sampler and collect the posterior draws
4. Record wall time, divergences, max tree depth hits, and step size adaptation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
