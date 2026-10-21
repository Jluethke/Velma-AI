# Authentication Session Test

Test authentication mechanisms and session management for weaknesses.

## Inputs

- `authentication-flows`: Documented auth flows
- `application-map`: Login, registration, and password reset endpoints

## Outputs

- `auth-session-findings`: Authentication and session management vulnerabilities
- `brute-force-results`: Results of credential stuffing and brute force resistance tests

## Process

1. Test for credential stuffing and brute force resistance (rate limiting, lockout)
2. Analyze session token entropy, lifetime, and invalidation on logout
3. Test password reset flow for account takeover vectors
4. Check for session fixation and cookie security attributes (HttpOnly, Secure, SameSite)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
