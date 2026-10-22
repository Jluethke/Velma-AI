# Rate Limit Policy Designer

Define rate limit policies for each consumer tier and endpoint.

## Inputs

- `traffic-profile`: Current traffic patterns
- `capacity-baseline`: System capacity

## Outputs

- `rate-limit-policies`: Limits per consumer tier, per endpoint, with burst allowances
- `response-headers-spec`: Rate limit response headers (X-RateLimit-Limit, Remaining, Reset)

## Process

1. Set global rate limits based on system capacity.
2. Set per-tier limits: free (lowest), paid, partner, internal (highest or unlimited).
3. Set per-endpoint limits for expensive operations.
4. Define burst allowances and the throttling algorithm (token bucket, sliding window).
5. Define the response headers to include with every response.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
