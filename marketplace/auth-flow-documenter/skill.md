# Auth Flow Documenter

Produce the authentication flow documentation.

## Inputs

- `auth-endpoints-spec`: Authentication endpoints
- `error-responses-spec`: Error handling
- `scope-model`: Scope definitions

## Outputs

- `auth-flow-doc`: Complete authentication and authorization documentation
- `auth-quickstart`: Quick start guide for getting authenticated

## Process

1. Document the full authentication flow with sequence diagrams.
2. Write the scope reference: what each scope grants.
3. Write the quick start: how to get credentials, make the first authenticated request.
4. Document token management: storage, refresh, revocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
