# Gateway Requirements Gatherer

Gather requirements for the API gateway configuration.

## Inputs

- `api-inventory`: List of APIs to route through the gateway
- `traffic-profile`: Expected traffic patterns (requests per second, peak times, geographic distribution)

## Outputs

- `gateway-requirements`: Requirements: routing rules, authentication methods, rate limits, CORS, SSL, caching
- `gateway-selection`: Selected gateway solution with justification (Kong, AWS API Gateway, Nginx, Traefik, custom)

## Process

1. List every API and the routing rules needed (path-based, host-based, header-based).
2. Define the authentication methods to support (API key, OAuth 2.0, JWT, mutual TLS).
3. Define the rate limiting requirements per consumer tier.
4. Evaluate gateway options against the requirements and select one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
