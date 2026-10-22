# Synthetic Fidelity Validator

Validate the synthetic data against the real data distributions.

## Inputs

- `synthetic-dataset`: Generated data
- `real-data-sample`: Real data for comparison

## Outputs

- `fidelity-report`: Statistical comparison of synthetic vs real
- `privacy-audit`: Privacy leakage assessment

## Process

1. Compare marginal distributions between synthetic and real.
2. Check correlations and joint distributions.
3. Run privacy leakage tests (membership inference, attribute inference).
4. Report fidelity scores and privacy risk levels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
