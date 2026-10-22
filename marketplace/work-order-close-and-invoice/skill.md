# Work Order Close And Invoice

Close the work order, generate the invoice, and prepare the vehicle for customer pickup.

## Inputs

- `quality-check-result`: Quality check pass or fail result
- `repair-log`: Actual parts and labor for invoicing

## Outputs

- `final-invoice`: Invoice with actual parts, labor, taxes, and total
- `work-order-record`: Completed work order with all documentation

## Process

1. Generate the invoice from the actual parts used and labor time.
2. Apply any discounts, coupons, or warranty credits.
3. Move the vehicle to the ready area and note the parking location.
4. Notify the customer the vehicle is ready for pickup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
