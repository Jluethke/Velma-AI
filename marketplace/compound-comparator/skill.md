# Compound Comparator

Compare potency and efficacy across compounds or conditions.

## Inputs

- `dose-response-fit`: Fitted parameters (IC50, Hill slope, plateaus) per compound
- `percent-viability`: Normalized viability data for all compounds

## Outputs

- `potency-ranking`: Compounds ranked by IC50 with confidence intervals
- `selectivity-index`: Ratio of IC50 values between cell types if tested on multiple lines

## Process

1. Rank compounds by IC50 from most to least potent
2. Compute selectivity indices if data from multiple cell lines is available
3. Overlay dose-response curves on a single plot for visual comparison
4. Identify the lead compound(s) based on potency, efficacy, and selectivity criteria

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
