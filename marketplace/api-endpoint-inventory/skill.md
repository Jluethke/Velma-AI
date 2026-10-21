# Api Endpoint Inventory

Inventory all API endpoints, HTTP methods, parameters, and response structures from documentation and active probing.

## Inputs

- `api-specification`: OpenAPI/Swagger spec, GraphQL schema, or API documentation
- `api-base-url`: Base URL of the API under test

## Outputs

- `endpoint-map`: Complete map of endpoints, methods, parameters, and expected responses
- `auth-requirements`: Authentication requirements for each endpoint

## Process

1. Parse the API specification to extract all defined endpoints and methods.
2. Probe for undocumented endpoints using wordlist-based path enumeration.
3. Map authentication requirements (API key, OAuth, JWT, none) for each endpoint.
4. Record expected request and response schemas for validation testing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
