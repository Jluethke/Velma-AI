# Redirect Uri Manipulation Tester

Test for redirect URI manipulation and open redirect vulnerabilities.

## Inputs

- `flow-inventory`: OAuth flow inventory
- `oauth-configuration`: OAuth configuration with registered redirect URIs

## Outputs

- `redirect-test-results`: Results of redirect URI manipulation tests
- `open-redirect-findings`: Any open redirect vulnerabilities found

## Process

1. Test exact match enforcement: try adding path segments, query parameters, or fragments
2. Test for subdomain takeover of registered redirect domains
3. Test for open redirectors on the redirect URI domain that could be chained
4. Verify that wildcard or partial-match redirect URI registrations are not allowed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
