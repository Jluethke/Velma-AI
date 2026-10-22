# Refund Exchange Processor

Process the refund, exchange, or store credit based on the inspection.

## Inputs

- `inspection-result`: Inspection outcome
- `return-authorization`: RMA and order details

## Outputs

- `refund-confirmation`: Refund, exchange, or credit confirmation
- `customer-notification`: Notification sent to the customer

## Process

1. Calculate the refund amount (full, partial, or restocking fee).
2. Process the payment reversal or issue store credit.
3. For exchanges, create the replacement order.
4. Send the confirmation notification to the customer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
