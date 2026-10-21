# Idp Account Enumeration Check

Test whether the identity provider leaks information about valid usernames through login, registration, or password reset flows.

## Inputs

- `auth-flow-map`: Map of authentication flows
- `scope-definition`: In-scope endpoints

## Outputs

- `enumeration-findings`: Endpoints and behaviors that leak account existence
- `timing-analysis`: Response time differences that may indicate valid vs invalid accounts

## Process

1. Test login endpoint responses for valid vs invalid usernames
2. Check password reset flow for account existence disclosure
3. Measure response timing differences between valid and invalid accounts
4. Test registration flow for duplicate account detection messages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
