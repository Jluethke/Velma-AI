# Service Order Receiver

Receive and validate the service order.

## Inputs

- `service-order`: The customer service order with requested services and specifications
- `customer-account`: Customer account information and service history

## Outputs

- `validated-order`: Order validated for completeness and accuracy
- `order-requirements`: Technical requirements extracted from the order

## Process

1. Verify the order contains all required fields (service type, location, bandwidth, SLA tier).
2. Validate the customer account is in good standing.
3. Extract the technical requirements from the order.
4. Flag any missing information and request clarification if needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
