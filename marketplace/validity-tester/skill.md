# Validity Tester

Assess convergent, discriminant, and criterion validity by correlating instrument scores with external measures.

## Inputs

- `pilot-response-data`: responses to the new instrument
- `construct-definition`: theoretical boundaries for convergent/discriminant predictions

## Outputs

- `validity-evidence`: convergent correlations, discriminant correlations, MTMM matrix if available
- `criterion-validity`: correlations with criterion measures (concurrent or predictive)

## Process

1. Correlate the instrument scores with measures of related constructs (convergent: expect high r)
2. Correlate with measures of unrelated constructs (discriminant: expect low r)
3. If criterion data are available, compute concurrent or predictive validity coefficients
4. Organize results in a multitrait-multimethod (MTMM) matrix if multiple methods are used

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
