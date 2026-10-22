# Return Authorization Issuer

Issue the return merchandise authorization and shipping instructions.

## Inputs

- `eligibility-result`: Eligibility determination
- `return-type`: Type of return (refund, exchange, credit)

## Outputs

- `return-authorization`: RMA number and return shipping label
- `return-instructions`: Instructions sent to the customer

## Process

1. Generate the RMA number.
2. Create the return shipping label (prepaid or customer-paid per policy).
3. Send the authorization and instructions to the customer.
4. Log the return in the order management system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
