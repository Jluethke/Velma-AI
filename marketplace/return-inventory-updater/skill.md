# Return Inventory Updater

Update inventory and produce the returns summary report.

## Inputs

- `restock-decision`: Restock or dispose decision
- `refund-confirmation`: Refund processing details

## Outputs

- `inventory-update`: Inventory adjustment record
- `returns-summary`: Returns summary with metrics

## Process

1. Update inventory counts for restocked items.
2. Record dispositions for non-restockable items.
3. Calculate return rate, refund total, and reason breakdown.
4. Produce the returns summary report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
