# Insurable Risk Inventory

Inventory every risk that could cause financial damage exceeding the damage threshold (3 months of income for personal, 3 months of revenue for business).

## Inputs

- `financial-profile`: Monthly income or revenue, major assets, dependents or stakeholders
- `risk-context`: Personal or business, industry, geography, specific exposures

## Outputs

- `insurable-risk-list`: Every risk above the damage threshold, with the estimated maximum loss
- `damage-threshold`: The calculated threshold: 3 months of income or revenue

## Process

1. Calculate the damage threshold: 3 times monthly income (personal) or 3 times monthly revenue (business).
2. List every event that could cause damage above that threshold: property damage, liability claims, health events, disability, death, business interruption, professional errors, cyber events, natural disasters, vehicle accidents, key person loss.
3. For each, estimate the maximum plausible loss. Use replacement cost for property, legal defense plus judgment for liability, lost income for disability.
4. Sort by maximum plausible loss, highest first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
