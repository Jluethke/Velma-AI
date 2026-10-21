# Oauth Flow Mapping

Map all OAuth flows, redirect URIs, and client registrations in the target application.

## Inputs

- `target-application`: Target application URL and OAuth endpoints
- `test-credentials`: Test credentials for the authorized assessment

## Outputs

- `oauth-flow-map`: Map of all OAuth flows and their configurations
- `redirect-uri-list`: All registered redirect URIs

## Process

1. Identify all OAuth endpoints (authorize, token, revoke, userinfo)
2. Enumerate registered clients and their allowed flows
3. Catalog all redirect URIs and their validation patterns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
