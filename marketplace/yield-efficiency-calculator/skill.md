# Yield Efficiency Calculator

Calculate overall yields and process efficiencies: product yield on substrate, carbon balance, and comparison to theoretical maximum.

## Inputs

- `time-course-data`: Final concentrations of biomass, substrate, and product
- `production-rates`: Productivity metrics

## Outputs

- `yield-table`: Yp/s, Yx/s, volumetric productivity, and process efficiency vs. theoretical max
- `carbon-balance`: Accounting of carbon into biomass, product, CO2, and unaccounted

## Process

1. Compute product yield on substrate: Yp/s = total product / total substrate consumed.
2. Compute biomass yield on substrate: Yx/s = total biomass / total substrate consumed.
3. Calculate the theoretical maximum yield from stoichiometry and compare.
4. Close the carbon balance: substrate carbon into biomass + product + CO2 should sum to ~100%.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
