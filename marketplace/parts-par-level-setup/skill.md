# Parts Par Level Setup

Set par levels and reorder points for commonly used parts based on usage history.

## Inputs

- `usage-history`: Parts usage data by part number over the prior period
- `lead-times`: Supplier lead times for each part or category

## Outputs

- `par-levels`: Minimum stock level for each part number
- `reorder-points`: Stock level at which to reorder, accounting for lead time and usage rate

## Process

1. Calculate the average daily or weekly usage for each stocked part number.
2. Factor in the supplier lead time for each part.
3. Set the reorder point at the usage rate times the lead time plus a safety buffer.
4. Set the par level at the reorder point plus one standard order quantity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
