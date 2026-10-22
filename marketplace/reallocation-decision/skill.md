# Reallocation Decision

Move spending from categories with low marginal returns to categories with high marginal returns.

## Inputs

- `marginal-returns`: Marginal return per category
- `diminishing-returns-notes`: Where each category sits on the diminishing returns curve

## Outputs

- `reallocation-plan`: How much to move from which categories to which other categories, with the expected net gain
- `minimum-thresholds`: Minimum spending levels below which a category cannot function (you cannot cut marketing to zero)

## Process

1. Rank categories by marginal return, highest to lowest.
2. Identify categories where you are past the diminishing returns threshold (marginal return is low relative to other categories). These are overfunded.
3. Identify categories where you are still in the sweet spot (marginal return is high). These are underfunded.
4. Move dollars from overfunded to underfunded categories. Each dollar moved increases total return because it leaves a low-marginal-return category and enters a high-marginal-return one. Stop when marginal returns equalize across categories.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
