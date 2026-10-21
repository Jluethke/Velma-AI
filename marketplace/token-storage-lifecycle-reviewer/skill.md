# Token Storage Lifecycle Reviewer

Review token storage practices and lifecycle management.

## Inputs

- `flow-inventory`: OAuth flow inventory
- `client-classification`: Client type classification

## Outputs

- `token-storage-findings`: Findings on how tokens are stored in each client type
- `lifecycle-findings`: Findings on token expiration, rotation, and revocation

## Process

1. Check where access tokens are stored (memory, localStorage, cookies, keychain) per client type
2. Verify that refresh tokens use rotation (each use issues a new refresh token)
3. Test token revocation: does revoking a token immediately prevent its use
4. Check access token lifetimes: shorter is better, with refresh token renewal

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
