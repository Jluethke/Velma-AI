# Oauth Scope Upgrade Test

Test for scope escalation by manipulating scope parameters during the OAuth flow.

## Inputs

- `csrf-findings`: CSRF findings
- `oauth-flow-map`: OAuth flow map

## Outputs

- `scope-escalation-findings`: Scope escalation test results
- `elevated-permissions`: Permissions gained through scope manipulation

## Process

1. Add unauthorized scopes to the authorization request
2. Test whether the token endpoint enforces scope restrictions
3. Attempt to upgrade scopes during token refresh

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
