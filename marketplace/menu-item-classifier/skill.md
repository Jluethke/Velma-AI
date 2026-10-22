# Menu Item Classifier

Classify each menu item by popularity (sales mix) and profitability (contribution margin).

## Inputs

- `sales-mix-data`: Number sold per item over the analysis period
- `item-cost-data`: Food cost and selling price per item

## Outputs

- `item-classification`: Each item classified as star, plow horse, puzzle, or dog
- `contribution-margins`: Contribution margin for each item

## Process

1. Calculate the contribution margin for each item.
2. Calculate the menu mix percentage for each item.
3. Plot items on the popularity vs profitability matrix.
4. Classify each item (star, plow horse, puzzle, dog).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
