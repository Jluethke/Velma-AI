# Api Authn Authz Designer

Design authentication and authorization for the API, including token formats, scopes, and permission models.

## Inputs

- `api-surface`: Endpoints, methods, and schemas
- `resource-sensitivity`: Sensitivity classification for each resource

## Outputs

- `authn-design`: Authentication design: token format (JWT, opaque), OAuth2 flows, API key handling
- `authz-design`: Authorization design: scopes, roles, permission matrix per endpoint

## Process

1. Select the authentication mechanism based on client types (web, mobile, service-to-service).
2. Define OAuth2 scopes or API key permissions mapped to each endpoint.
3. Build the permission matrix specifying which roles can access which endpoints and fields.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
