# Rate Limit Implementation Spec

Specify the implementation: where limits are enforced and how violations are handled.

## Inputs

- `rate-limit-policies`: Defined limits and algorithms
- `response-headers-spec`: Header format

## Outputs

- `implementation-spec`: Where and how rate limiting is enforced (gateway, middleware, distributed counter)
- `rate-limiting-doc`: Complete rate limiting design document for engineering and consumers

## Process

1. Choose the enforcement point: API gateway, application middleware, or both.
2. Select the counter storage: in-memory, Redis, distributed cache.
3. Define the 429 response format: error message, Retry-After header, documentation link.
4. Document the system for both the engineering team and API consumers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
