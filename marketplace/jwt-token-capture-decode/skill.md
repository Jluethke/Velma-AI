# Jwt Token Capture Decode

Capture JWT tokens from the application and decode their header, payload, and signature components.

## Inputs

- `target-application`: Base URL of the authorized target application
- `test-credentials`: Authorized test account credentials

## Outputs

- `decoded-tokens`: Decoded JWT header, payload, and signature for each captured token
- `token-usage-map`: Where tokens are issued, stored, and validated in the application

## Process

1. Authenticate and capture JWT tokens from login, API, and refresh flows
2. Decode each token to extract header (alg, kid, jwk) and payload (claims)
3. Map where tokens are stored (cookies, localStorage, Authorization header)
4. Document token issuance, refresh, and validation endpoints

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
