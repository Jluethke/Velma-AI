# Shipping Label Generator

Generate shipping labels and select the optimal carrier.

## Inputs

- `packed-order`: Packed order with dimensions and weight
- `verified-order`: Order with shipping address and service level

## Outputs

- `shipping-label`: Carrier label and tracking number
- `shipping-cost`: Actual shipping cost for the order

## Process

1. Calculate package dimensions and weight.
2. Rate-shop across carriers for the selected service level.
3. Generate the shipping label and tracking number.
4. Record the shipping cost against the order.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
