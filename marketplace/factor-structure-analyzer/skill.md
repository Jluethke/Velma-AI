# Factor Structure Analyzer

Confirm the hypothesized factor structure using exploratory and confirmatory factor analysis.

## Inputs

- `pilot-response-data`: item-level response matrix
- `content-domain-map`: expected number of factors and item assignments

## Outputs

- `efa-results`: exploratory factor analysis loadings, eigenvalues, and scree plot
- `cfa-results`: confirmatory factor analysis fit indices (CFI, TLI, RMSEA, SRMR) and standardized loadings
- `final-item-set`: retained items with factor assignments after pruning

## Process

1. Split the sample or use a separate sample for EFA and CFA
2. Run EFA with the expected number of factors; examine loadings and cross-loadings
3. Remove items with low loadings (<0.40) or high cross-loadings
4. Run CFA on the retained items; evaluate fit (CFI>0.95, RMSEA<0.06, SRMR<0.08)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
