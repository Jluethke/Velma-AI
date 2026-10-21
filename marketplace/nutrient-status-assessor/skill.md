# Nutrient Status Assessor

Assess soil nutrient status: compare N, P, K, and micronutrients against crop-specific thresholds, and identify deficiencies or excesses.

## Inputs

- `organized-results`: Nutrient analysis results (N, P, K, Ca, Mg, S, Fe, Mn, Zn, Cu, B)
- `crop-requirements`: Target crop's nutrient needs and the region's interpretation guide

## Outputs

- `nutrient-ratings`: Each nutrient rated as deficient, adequate, or excessive for the target crop
- `fertilizer-recommendations`: Suggested amendments with application rates based on soil test levels

## Process

1. Compare each nutrient level to the regional interpretation guide for the target crop.
2. Rate each nutrient: low (deficient), medium (adequate), high (surplus), or very high (excessive).
3. Check nutrient ratios (Ca:Mg, K:Mg) for balance issues.
4. Generate amendment recommendations using the guide's rate tables.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
