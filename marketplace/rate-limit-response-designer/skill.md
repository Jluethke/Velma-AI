# Rate Limit Response Designer

Design the response behavior when limits are hit.

## Inputs

- `rate-limit-policy`: The rate limits per tier
- `limit-algorithm`: The algorithm chosen

## Outputs

- `response-spec`: How the API responds when limits are hit (429 status, headers, retry guidance, queue option)
- `header-spec`: Rate limit headers returned on every response (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

## Process

1. Define the 429 response body: include the limit that was hit, when it resets, and how to request a higher tier.
2. Define the rate limit headers for every response (not just 429): Limit, Remaining, Reset.
3. Design the Retry-After header value (seconds until the next window).
4. Consider a queue or backpressure option for enterprise consumers instead of hard rejection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
