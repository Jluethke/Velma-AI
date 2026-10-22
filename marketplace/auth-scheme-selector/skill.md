# Auth Scheme Selector

Select the authentication scheme and design the token lifecycle.

## Inputs

- `auth-requirements`: What needs authentication and authorization
- `threat-model`: Threats to mitigate

## Outputs

- `auth-scheme`: Chosen authentication scheme with token format, lifetime, and refresh strategy
- `scope-model`: Authorization scopes and how they map to API endpoints

## Process

1. Select the scheme: API keys for server-to-server, OAuth 2.0 for user-facing, JWT for stateless.
2. Define the token lifecycle: issuance, expiration, refresh, revocation.
3. Map scopes to endpoints: which scope grants access to which operations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
