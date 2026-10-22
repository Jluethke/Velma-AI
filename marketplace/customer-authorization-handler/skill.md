# Customer Authorization Handler

Present the estimate to the customer and get authorization to proceed with the repair.

## Inputs

- `repair-estimate`: The itemized repair estimate
- `work-order-number`: Work order number for reference

## Outputs

- `authorization-record`: Customer authorization with approved line items, date, and method of approval
- `approved-repairs`: The specific repairs authorized by the customer

## Process

1. Contact the customer by their preferred method (phone, text, email).
2. Explain the findings and the recommended repairs in plain language.
3. Walk through the estimate line by line if the customer has questions.
4. Record the authorization (verbal, text, or signature) with date and time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
