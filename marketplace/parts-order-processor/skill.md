# Parts Order Processor

Generate and submit parts orders to suppliers when stock falls below the reorder point.

## Inputs

- `par-levels`: Minimum stock levels
- `reorder-points`: Trigger levels for reordering

## Outputs

- `purchase-orders`: Submitted purchase orders with part numbers, quantities, suppliers, and expected delivery dates
- `order-status`: Tracking status for each open order

## Process

1. Scan inventory levels against reorder points to identify parts that need ordering.
2. Group the needed parts by supplier for efficient ordering.
3. Submit the purchase orders and record the order numbers and expected delivery dates.
4. Update the inventory system with the pending orders.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
