# Worst Case Stackup Calculation

Calculate the worst-case stackup where every dimension simultaneously hits its extreme limit, giving the guaranteed minimum and maximum of the functional dimension.

## Inputs

- `dimension-chain`: All dimensions with nominal, tolerance, and direction
- `chain-diagram`: Loop diagram

## Outputs

- `worst-case-results`: Maximum and minimum functional dimension under worst-case conditions, and whether the requirement is met
- `sensitivity-ranking`: Dimensions ranked by their contribution to the total tolerance, showing which dimensions drive the result

## Process

1. Calculate the nominal gap: G_nom = sum of (sign_i * nominal_i) for all dimensions in the chain.
2. Calculate the worst-case maximum: G_max = G_nom + sum of |tolerance_i / 2| for all dimensions. Calculate the worst-case minimum: G_min = G_nom - sum of |tolerance_i / 2|.
3. Compare G_max and G_min to the functional requirement limits. If both are within spec, the design works under all tolerance combinations. If not, the worst-case method says it can fail.
4. Rank dimensions by tolerance contribution: each dimension's contribution is |tolerance_i| / sum of all |tolerance_i|. The top 2-3 contributors typically account for 60-80% of the total. These are where tolerance tightening has the most leverage.
5. The worst-case method is conservative: it assumes every dimension simultaneously hits its worst limit. This is physically unlikely for chains of more than 3-4 dimensions. If worst-case fails, proceed to statistical methods before tightening tolerances.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
