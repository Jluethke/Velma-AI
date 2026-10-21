# Pkce Implementation Verifier

Verify PKCE implementation for public clients.

## Inputs

- `client-classification`: Classification of clients as public or confidential
- `flow-inventory`: OAuth flow details

## Outputs

- `pkce-verification-results`: Results of PKCE verification for each public client
- `authorization-code-interception-risk`: Risk of authorization code interception for clients without PKCE

## Process

1. Verify that all public clients use PKCE (code_challenge and code_verifier)
2. Test whether the authorization server accepts authorization code exchange without PKCE for public clients
3. Verify that S256 (SHA-256) is required, not plain code challenge method
4. Check that code_verifier length meets minimum requirements (43 characters)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
