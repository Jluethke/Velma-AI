# Api Rate Limit Designer

Design rate limiting and abuse prevention for the API.

## Inputs

- `api-surface`: Endpoints, methods, and schemas
- `authz-design`: Authorization design with roles and scopes

## Outputs

- `rate-limit-rules`: Rate limits per endpoint, per client tier, and per authentication level
- `abuse-prevention-config`: Abuse prevention rules: bot detection, credential stuffing protection, account lockout

## Process

1. Set rate limits per endpoint based on expected legitimate usage patterns.
2. Differentiate limits by client tier and authentication level.
3. Design abuse prevention rules for authentication endpoints (lockout, CAPTCHA, progressive delay).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
