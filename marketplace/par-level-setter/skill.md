# Par Level Setter

Set par levels for each ingredient based on usage history and lead time.

## Inputs

- `ingredient-list`: All ingredients used in the menu
- `usage-history`: Historical usage data by ingredient

## Outputs

- `par-levels`: Par level for each ingredient
- `reorder-points`: Reorder trigger points by ingredient

## Process

1. Calculate average daily usage for each ingredient.
2. Factor in supplier lead times and delivery schedules.
3. Set par levels with a safety stock buffer.
4. Define the reorder point for each item.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
