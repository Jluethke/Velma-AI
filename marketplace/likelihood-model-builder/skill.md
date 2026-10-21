# Likelihood Model Builder

Define the likelihood function linking the observed data to the parameters, including the data-generating process and distributional assumptions.

## Inputs

- `observed-data`: the dataset to analyze
- `prior-specification`: prior distributions for parameters

## Outputs

- `generative-model`: complete probabilistic model specification (priors + likelihood)
- `model-dag`: graphical model (DAG) showing dependencies among variables and parameters

## Process

1. Specify the data-generating process as a probability distribution conditioned on parameters
2. Identify hierarchical structure (groups, repeated measures) and encode it in the model
3. Draw the graphical model showing all dependencies
4. Write the model in a probabilistic programming language (Stan, PyMC, JAGS notation)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
