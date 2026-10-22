# Variance Tracking Setup

Set up variance tracking: actual spending vs. allocated amount for each category. Variances trigger reallocation decisions, not just reports.

## Inputs

- `funded-categories`: The allocated budget by category
- `marginal-allocation`: The boundary category for context

## Outputs

- `variance-tracking-plan`: For each category: the allocated amount, the tracking frequency, and the variance threshold that triggers review
- `reallocation-rules`: Rules for reallocating funds: underspend in one category can fund the top unfunded category

## Process

1. For each funded category, set the tracking frequency: weekly for high-velocity spending (variable costs, marketing), monthly for stable spending (subscriptions, fixed costs).
2. Set the variance threshold: a deviation of more than 15% from the allocated amount triggers a review. The review asks: is the variance a timing issue or a structural issue?
3. Define the reallocation rules: if a category is trending to underspend by more than 20%, the excess can be reallocated to the highest-priority unfunded category.
4. At the end of the period, the variance data becomes the evidence base for the next zero-based cycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
