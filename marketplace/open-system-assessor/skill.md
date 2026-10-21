# Open System Assessor

Assess whether the sample has remained a closed system since formation.

## Inputs

- `calculated-age`: Initial age calculation
- `concordance-assessment`: Concordia or isochron fit quality
- `sample-description`: Geological context of the sample

## Outputs

- `system-integrity-verdict`: Assessment of closed-system behavior (concordant, discordant, reset, or mixed)
- `geochronology-report`: Final dating report with age, uncertainty, and geological interpretation

## Process

1. Evaluate concordance or isochron fit (MSWD, probability of fit)
2. Check for evidence of Pb loss, excess Ar, or other open-system indicators
3. Compare the age with independent constraints (stratigraphy, other dating systems)
4. Write the final report with the preferred age interpretation and its caveats

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
