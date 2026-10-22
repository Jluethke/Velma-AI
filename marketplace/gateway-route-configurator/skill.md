# Gateway Route Configurator

Configure the routing, authentication, and policies.

## Inputs

- `gateway-requirements`: The gathered requirements
- `gateway-selection`: The selected gateway

## Outputs

- `route-configuration`: The routing configuration mapping external paths to internal services
- `policy-configuration`: Authentication, rate limiting, CORS, caching, and transformation policies

## Process

1. Configure each route: external path to internal service URL, method filtering, path rewriting.
2. Configure authentication: which routes require which auth method, how credentials are validated.
3. Configure rate limiting: per-consumer, per-endpoint, with appropriate responses (429 with Retry-After header).
4. Configure CORS, request/response transformations, and caching policies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
