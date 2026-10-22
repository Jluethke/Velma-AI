# Delivery Address Collector

Collect and validate delivery addresses and time windows.

## Inputs

- `order-list`: List of orders with delivery addresses
- `service-level-rules`: Delivery time windows and priority rules

## Outputs

- `validated-addresses`: Geocoded and validated delivery addresses
- `time-window-assignments`: Delivery time windows assigned per order

## Process

1. Validate and geocode each delivery address
2. Assign time windows based on service level and customer preference
3. Flag addresses with access restrictions or special instructions
4. Produce the validated address list

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
