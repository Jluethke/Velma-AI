# Oauth Flow Inventory

Map all OAuth2 and OIDC flows in use across the application.

## Inputs

- `application-architecture`: Architecture of the application under review
- `oauth-configuration`: OAuth provider and client configurations

## Outputs

- `flow-inventory`: Inventory of all OAuth flows with client types and grant types
- `client-classification`: Classification of each client as public or confidential

## Process

1. Identify all OAuth clients registered with the authorization server
2. Map each client to its grant type (authorization code, client credentials, device, implicit, ROPC)
3. Classify each client as public (SPA, mobile, CLI) or confidential (server-side)
4. Flag any use of deprecated flows (implicit, ROPC) that should be migrated

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
