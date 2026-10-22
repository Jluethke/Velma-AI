# Theoretical Cost Calculator

Calculate the theoretical food cost for each menu item.

## Inputs

- `recipe-cards`: Standardized recipes with ingredient quantities
- `current-ingredient-prices`: Current purchase prices for all ingredients

## Outputs

- `theoretical-cost-by-item`: Cost per menu item based on recipe and price
- `menu-margin-analysis`: Margin analysis for each menu item

## Process

1. Cost each ingredient in each recipe at current prices.
2. Calculate the total cost per portion.
3. Compare cost against the selling price for margin.
4. Flag items below the target margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
