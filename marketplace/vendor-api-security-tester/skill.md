# Vendor Api Security Tester

Test the security of API integrations with each vendor.

## Inputs

- `integration-inventory`: Integration details including APIs
- `data-sharing-matrix`: Data types exchanged per API

## Outputs

- `api-security-findings`: Authentication, authorization, encryption, and input validation issues
- `api-risk-ratings`: Risk rating for each vendor API integration

## Process

1. Test authentication mechanisms (API keys, OAuth, mTLS) for each integration
2. Verify that data in transit is encrypted with current TLS versions
3. Test for authorization bypass (accessing other tenants' data, horizontal privilege escalation)
4. Check rate limiting and error handling for information disclosure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
