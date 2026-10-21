# Idp Token Session Test

Test token handling and session management for weaknesses in issuance, validation, and expiration.

## Inputs

- `auth-flow-map`: Map of authentication flows
- `idp-access`: Access to test authentication endpoints

## Outputs

- `token-findings`: Weaknesses found in token issuance, validation, and storage
- `session-findings`: Weaknesses found in session lifecycle management

## Process

1. Check token expiration times and refresh policies
2. Test whether tokens can be replayed after logout
3. Verify that token signatures are validated and algorithms are pinned
4. Check session fixation and concurrent session handling

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
