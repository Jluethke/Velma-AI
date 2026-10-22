# Delivery Inspector

Receive and inspect deliveries against purchase orders.

## Inputs

- `purchase-orders`: Expected orders
- `delivery-documents`: Invoices and packing slips from deliveries

## Outputs

- `receiving-log`: Accepted items with quantities and conditions
- `discrepancy-report`: Short shipments, quality issues, and substitutions

## Process

1. Check delivered quantities against the purchase order.
2. Inspect quality (temperature, freshness, packaging).
3. Log discrepancies and notify the supplier.
4. Update inventory counts with accepted items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
