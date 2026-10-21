# Jwt Expiration Revocation Test

Test token expiration enforcement and revocation capabilities.

## Inputs

- `decoded-tokens`: Tokens with exp and iat claims
- `token-usage-map`: Token validation endpoints

## Outputs

- `expiration-results`: Whether expired tokens are properly rejected
- `revocation-results`: Whether token revocation works after logout or password change

## Process

1. Submit tokens past their exp claim and check for rejection
2. Log out and resubmit the pre-logout token to test revocation
3. Change the password and resubmit old tokens
4. Test for excessively long token lifetimes (hours or days for access tokens)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
