# Sem Path Diagram Spec

Specify the theoretical model as a path diagram with latent variables, observed indicators, and hypothesized causal paths.

## Inputs

- `research-question`: The causal or measurement question the model addresses
- `variable-list`: All observed and latent variables with their roles

## Outputs

- `path-diagram`: The specified path diagram with all paths labeled
- `model-hypotheses`: Each path stated as a testable directional hypothesis

## Process

1. List all latent constructs and their observed indicator variables.
2. Draw directed paths for hypothesized causal relationships and covariance arcs for correlated errors.
3. Label each path with a parameter name and document the theoretical justification.
4. Check identification rules: count free parameters against known elements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
