# Cors Preflight Cache Test

Test for preflight cache poisoning and manipulation of cached CORS responses.

## Inputs

- `credential-exposure-results`: Credential exposure results
- `endpoint-cors-map`: Endpoint CORS map

## Outputs

- `cache-poison-results`: Preflight cache poisoning test results
- `max-age-findings`: Excessive Access-Control-Max-Age values found

## Process

1. Check Access-Control-Max-Age values for excessive caching
2. Test for preflight response manipulation through cache poisoning
3. Assess whether cached preflight responses can be exploited

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
