# Cooperativity Tester

Test for cooperative binding by analyzing Hill coefficient and Scatchard plot linearity.

## Inputs

- `specific-binding`: Saturation binding data
- `fit-results`: Hill equation fit parameters including Hill coefficient

## Outputs

- `cooperativity-assessment`: Hill coefficient interpretation: positive cooperativity (nH > 1), negative (nH < 1), or none (nH = 1)
- `scatchard-plot`: Scatchard transformation (B/F vs B) showing linearity or curvature

## Process

1. Examine the Hill coefficient from the Hill equation fit and its confidence interval
2. Determine if nH significantly differs from 1 (indicating cooperativity or multiple sites)
3. Construct the Scatchard plot and assess linearity (linear = one site, curved = complex binding)
4. Report whether binding is simple, cooperative, or involves heterogeneous sites

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
