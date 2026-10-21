# Idp Logout Revocation Check

Test logout and token revocation to verify that sessions and tokens are properly invalidated.

## Inputs

- `token-findings`: Token handling findings
- `federation-findings`: Federation trust findings

## Outputs

- `logout-findings`: Gaps in logout and session invalidation
- `revocation-findings`: Gaps in token revocation and propagation

## Process

1. Test single logout across federated applications
2. Check whether access tokens remain valid after logout
3. Verify that refresh token revocation propagates to access tokens
4. Test back-channel logout notification handling

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
