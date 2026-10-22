# Purchase Order Generator

Generate purchase orders based on the forecast and reorder points.

## Inputs

- `reorder-points`: Reorder points per SKU
- `scenario-results`: Demand scenario analysis

## Outputs

- `purchase-orders`: Generated purchase orders
- `inventory-forecast`: Complete inventory forecast document

## Process

1. Identify SKUs at or below the reorder point.
2. Calculate order quantities (economic order quantity or fixed period).
3. Group orders by supplier to minimize shipping costs.
4. Generate the purchase orders and the inventory forecast summary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
