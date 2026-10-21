# Payment Fraud Pattern Test

Test the payment system against common fraud patterns: card testing, velocity attacks, and amount manipulation.

## Inputs

- `payment-api-access`: Access to payment API in test or staging environment
- `scope-findings`: Scope findings for attack surface context

## Outputs

- `fraud-findings`: Fraud pattern vulnerabilities found
- `fraud-detection-gaps`: Fraud patterns not caught by existing controls

## Process

1. Simulate card testing attacks (small transactions to validate stolen card numbers)
2. Test velocity controls by submitting many transactions in rapid succession
3. Attempt amount manipulation (negative amounts, zero amounts, overflow values)
4. Test for race conditions in balance checks and transaction processing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
