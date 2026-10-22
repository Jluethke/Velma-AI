# Parts Receiving And Stocking

Receive parts shipments, verify against the purchase order, and stock the parts.

## Inputs

- `purchase-orders`: Open purchase orders to receive against
- `order-status`: Current order tracking status

## Outputs

- `receiving-record`: Record of parts received with quantities, condition, and any discrepancies
- `updated-inventory`: Inventory counts updated with received parts

## Process

1. Match the incoming shipment to the purchase order.
2. Verify the part numbers, quantities, and condition against the order.
3. Note any discrepancies (wrong part, short shipment, damage) and contact the supplier.
4. Stock the parts in the designated bin locations and update inventory counts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
