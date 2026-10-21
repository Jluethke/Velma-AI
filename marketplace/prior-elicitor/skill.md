# Prior Elicitor

Specify and justify the prior distribution for each parameter using domain knowledge, previous studies, or weakly informative defaults.

## Inputs

- `model-parameters`: list of parameters requiring priors
- `domain-knowledge`: published ranges, expert estimates, or physical constraints

## Outputs

- `prior-specification`: distribution family and hyperparameters for each prior
- `prior-justification`: documented rationale for each prior choice

## Process

1. For each parameter, gather domain information on plausible ranges
2. Select a distribution family that matches the parameter's support and shape (normal, half-normal, beta, gamma, etc.)
3. Set hyperparameters to encode the prior knowledge or use weakly informative defaults (e.g., Gelman recommendations)
4. Document the justification and plan a prior sensitivity analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
