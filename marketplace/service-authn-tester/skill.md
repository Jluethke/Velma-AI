# Service Authn Tester

Test service-to-service authentication for mTLS, JWT, and API key implementations.

## Inputs

- `service-topology`: Service topology map
- `communication-matrix`: Service communication matrix

## Outputs

- `authn-test-results`: Results of authentication tests for each service pair
- `unauthenticated-paths`: Service paths that accept unauthenticated requests

## Process

1. For each service pair, test whether requests without valid credentials are rejected
2. Verify mTLS certificate validation (expired, wrong CA, self-signed)
3. Test JWT validation (expired, wrong issuer, tampered signature, algorithm confusion)
4. Identify services that accept requests from any caller without authentication

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
