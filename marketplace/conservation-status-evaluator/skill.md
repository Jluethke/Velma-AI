# Conservation Status Evaluator

Evaluate the conservation status of the study population against IUCN criteria: population size, trend, range, threats, and viability.

## Inputs

- `population-estimate`: Current abundance and trend
- `demographic-rates`: Survival and recruitment rates
- `habitat-profile`: Habitat quality and threats

## Outputs

- `conservation-assessment`: Status evaluation against IUCN criteria (A through E)
- `threat-register`: Ranked threats with severity, scope, and reversibility
- `viability-outlook`: Population viability projection under current conditions

## Process

1. Apply IUCN criterion A (population decline) from trend data
2. Apply criterion B (geographic range) from occurrence records
3. Apply criterion C (small population) from abundance estimate
4. Identify and rank threats by severity and scope
5. Project population trajectory under current threat levels

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
