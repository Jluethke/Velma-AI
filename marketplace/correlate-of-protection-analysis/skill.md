# Correlate Of Protection Analysis

Analyze preclinical immunogenicity and challenge data to identify correlates of protection and define the target product profile.

## Inputs

- `animal-protocol`: Study design for reference
- `assay-panel`: Assays used to measure immune response

## Outputs

- `correlate-analysis`: Statistical analysis linking immune markers to protection outcomes
- `target-product-profile`: Minimum and preferred immune response thresholds for efficacy

## Process

1. Tabulate individual-animal immune responses against protection outcomes (survival, viral load, pathology score)
2. Run receiver operating characteristic analysis to identify threshold values for each immune marker
3. Test multivariate models combining humoral and cellular markers for predictive accuracy
4. Define the target product profile with minimum protective immune response benchmarks

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
