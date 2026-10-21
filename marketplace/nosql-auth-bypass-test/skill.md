# Nosql Auth Bypass Test

Check for authentication bypass through NoSQL injection on login and session endpoints.

## Inputs

- `blind-injection-results`: Blind injection results
- `injection-points`: Injection points

## Outputs

- `auth-bypass-results`: Authentication bypass test results
- `bypassed-accounts`: Accounts accessible through injection bypass

## Process

1. Inject $ne and $gt operators into login fields
2. Test for always-true conditions in authentication queries
3. Attempt to access admin accounts through injection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
