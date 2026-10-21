# Oauth Csrf Test

Test for CSRF attacks against OAuth flows including state parameter validation.

## Inputs

- `code-intercept-findings`: Code interception findings
- `oauth-flow-map`: OAuth flow map

## Outputs

- `csrf-findings`: CSRF vulnerabilities in OAuth flows
- `state-validation-status`: Whether state parameter is properly validated

## Process

1. Test for missing or predictable state parameter
2. Attempt login CSRF by forcing a victim to authenticate as the attacker
3. Check for PKCE enforcement on public clients

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
