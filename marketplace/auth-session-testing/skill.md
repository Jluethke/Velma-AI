# Auth Session Testing

Test authentication mechanisms and session management for weaknesses including brute force, credential stuffing, and session fixation.

## Inputs

- `endpoint-inventory`: List of discovered endpoints
- `injection-findings`: Previously found injection vulnerabilities that may affect auth

## Outputs

- `auth-findings`: List of authentication and session management vulnerabilities
- `auth-evidence`: Proof-of-concept demonstrations for each auth finding

## Process

1. Test password policies, account lockout, and brute force protections.
2. Check session token generation for randomness and predictability.
3. Test for session fixation, session hijacking, and insecure session storage.
4. Verify logout functionality properly invalidates sessions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
