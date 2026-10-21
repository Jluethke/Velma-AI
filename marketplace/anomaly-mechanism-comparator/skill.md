# Anomaly Mechanism Comparator

Compare the anomaly against known physical, chemical, or biological mechanisms that could produce a signal of this shape and magnitude.

## Inputs

- `anomaly-profile`: Quantitative characterization of the anomaly
- `domain-knowledge-base`: Catalog of known mechanisms in the relevant field

## Outputs

- `mechanism-candidates`: Ranked list of mechanisms that could explain the anomaly
- `mechanism-fit-scores`: How well each candidate matches the observed profile

## Process

1. Extract the anomaly's signature features (shape, timescale, amplitude, spectral content).
2. Search the domain knowledge base for mechanisms producing similar signatures.
3. Score each candidate mechanism against the observed profile.
4. Rank candidates by fit quality and note any that can be ruled out by auxiliary data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
