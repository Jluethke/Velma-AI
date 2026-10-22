# Rate Limit Implementer

Implement the rate limiting and document it for consumers.

## Inputs

- `response-spec`: The response behavior spec
- `rate-limit-policy`: The policy to implement
- `header-spec`: The header spec

## Outputs

- `implementation-spec`: The implementation spec: where limits are enforced (gateway, middleware, application), storage (Redis, in-memory), key format
- `rate-limiting-documentation`: Consumer-facing documentation explaining the limits, how to check usage, and how to handle 429 responses

## Process

1. Decide where to enforce: API gateway (simplest), middleware (more control), or application layer (most flexible).
2. Choose the storage backend for counters (Redis for distributed, in-memory for single-node).
3. Define the key format: by API key, by IP, or by consumer ID.
4. Write the consumer-facing documentation: what the limits are, how to check remaining quota, how to handle 429.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
