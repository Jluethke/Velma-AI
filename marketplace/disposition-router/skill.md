# Disposition Router

Route returned items to the correct disposition path.

## Inputs

- `grading-results`: Condition grade per item
- `disposition-recommendations`: Recommended disposition for each item

## Outputs

- `disposition-actions`: Actions taken per item (restock, refurbish, recycle, dispose)
- `inventory-updates`: Inventory adjustments resulting from each disposition

## Process

1. Route new and like-new items to restock
2. Send damaged items to refurbishment or liquidation
3. Route defective items to recycling or disposal
4. Update inventory records for each disposition action

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
