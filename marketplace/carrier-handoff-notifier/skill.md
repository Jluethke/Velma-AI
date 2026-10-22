# Carrier Handoff Notifier

Hand off the package to the carrier and send the tracking notification.

## Inputs

- `shipping-label`: Label and tracking number
- `packed-order`: Packed order details

## Outputs

- `shipment-confirmation`: Carrier pickup confirmation
- `fulfillment-record`: Complete fulfillment record

## Process

1. Schedule carrier pickup or drop at the shipping station.
2. Scan the package out of the warehouse.
3. Send the tracking notification to the customer.
4. Record the shipment in the order management system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
