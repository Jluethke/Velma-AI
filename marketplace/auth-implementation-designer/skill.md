# Auth Implementation Designer

Design the implementation details and error handling.

## Inputs

- `auth-scheme`: Chosen scheme and token lifecycle
- `scope-model`: Scope-to-endpoint mapping

## Outputs

- `auth-endpoints-spec`: Token, authorize, and revoke endpoint specifications
- `error-responses-spec`: Authentication error responses (401, 403) with messages

## Process

1. Design the authentication endpoints: token exchange, refresh, revocation.
2. Define error responses: 401 (unauthenticated), 403 (insufficient scope), with actionable messages.
3. Specify rate limiting on authentication endpoints to prevent brute force.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
