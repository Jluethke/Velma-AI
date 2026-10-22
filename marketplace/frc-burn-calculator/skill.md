# Frc Burn Calculator

Compute the net monthly burn rate.

## Inputs

- `financial-context`: The monthly inflows and outflows
- `available-cash`: The cash the burn draws down

## Outputs

- `monthly-burn`: The net monthly outflow after reliable inflow
- `burn-breakdown`: The burn broken down by category

## Process

1. Total the monthly outflows across fixed and variable costs.
2. Subtract any reliable monthly inflow to get the net burn.
3. Break the burn down by category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
