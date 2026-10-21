# Standard Classifier

Classify the particle size distribution according to applicable standards: USCS soil classification, pharmaceutical sieve specifications, or cement fineness.

## Inputs

- `summary-statistics`: PSD summary parameters
- `applicable-standard`: Which classification system to apply

## Outputs

- `classification-result`: Standard classification (e.g., well-graded sand, fine silt, USP sieve class)
- `specification-compliance`: Whether the distribution meets target specifications

## Process

1. Apply the standard's classification rules using Cu, Cc, and percentage in each size fraction.
2. Assign the classification category.
3. If a target specification exists, check whether the distribution falls within the acceptable envelope.
4. Note any marginal values that are close to classification boundaries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
