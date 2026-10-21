# Broken Access Control Test

Test for broken access control vulnerabilities including IDOR, privilege escalation, and missing function-level access control.

## Inputs

- `application-map`: Endpoints and parameters to test
- `test-credentials`: Accounts at different privilege levels

## Outputs

- `access-control-findings`: Confirmed access control vulnerabilities with evidence
- `idor-results`: Insecure direct object reference test results

## Process

1. Test horizontal access control by accessing other users' resources with swapped identifiers
2. Test vertical access control by attempting admin functions from a regular user account
3. Check for missing function-level access control on API endpoints
4. Test for forced browsing to unlinked administrative pages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
