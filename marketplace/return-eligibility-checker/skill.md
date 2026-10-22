# Return Eligibility Checker

Verify the return request against the return policy.

## Inputs

- `return-request`: Customer return request with order details
- `return-policy`: Current return policy rules

## Outputs

- `eligibility-result`: Whether the return is eligible and why
- `return-type`: Return type (refund, exchange, store credit)

## Process

1. Check the return window (days since delivery).
2. Verify the product is in a returnable category.
3. Confirm the reason code matches eligible reasons.
4. Determine the return type based on policy and customer preference.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
