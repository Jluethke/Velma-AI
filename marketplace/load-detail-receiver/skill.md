# Load Detail Receiver

Receive and validate the shipper's load details.

## Inputs

- `load-request`: Shipper's load details (origin, destination, commodity, weight, dimensions, pickup/delivery dates)
- `shipper-profile`: Shipper account and credit information

## Outputs

- `validated-load`: Load details validated for completeness and feasibility
- `rate-estimate`: Estimated market rate for the lane based on current conditions

## Process

1. Verify load details are complete (commodity, weight, dimensions, hazmat status, temperature requirements).
2. Confirm pickup and delivery dates and windows.
3. Estimate the market rate for the lane using historical data and current spot market.
4. Check the shipper's credit and payment terms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
