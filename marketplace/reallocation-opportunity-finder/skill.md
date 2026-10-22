# Reallocation Opportunity Finder

Find reallocation opportunities: move dollars from categories with low marginal returns to categories with high marginal returns.

## Inputs

- `marginal-returns`: The marginal return estimates for each category
- `allocation-snapshot`: The current spending levels

## Outputs

- `reallocation-opportunities`: Pairs of categories: take from the low-marginal-return category, give to the high-marginal-return category, with the expected net gain
- `reallocation-constraints`: Minimum spending levels below which a category cannot function (the floor), preventing over-optimization

## Process

1. Rank categories by marginal return, highest to lowest. The spread between the highest and lowest marginal returns is your reallocation opportunity.
2. For each low-marginal-return category, determine the floor: the minimum spend below which the category cannot function. You can take from above the floor but not below it.
3. Pair the highest-marginal-return categories (destinations) with the lowest-marginal-return categories (sources). Calculate the net gain: marginal return gained minus marginal return lost.
4. Prioritize reallocations by net gain. The highest-net-gain reallocation is the single best move you can make with your existing budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
