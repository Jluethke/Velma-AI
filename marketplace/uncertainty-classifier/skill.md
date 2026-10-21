# Uncertainty Classifier

Classify each input's uncertainty as Type A (evaluated by statistical methods) or Type B (evaluated by other means), and as random or systematic.

## Inputs

- `measurement-table`: Inputs with their uncertainties

## Outputs

- `classified-uncertainties`: Each uncertainty labeled by type (A/B) and nature (random/systematic)
- `correlation-notes`: Any correlations between input uncertainties

## Process

1. For each uncertainty, determine whether it was derived from repeated measurements (Type A) or other information (Type B).
2. Classify as random (varies independently each measurement) or systematic (constant bias).
3. Identify any correlations: inputs measured with the same instrument or from the same calibration.
4. Document the probability distribution assumed for each (normal, rectangular, triangular).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
