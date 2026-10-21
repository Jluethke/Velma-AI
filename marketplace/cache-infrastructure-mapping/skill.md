# Cache Infrastructure Mapping

Map the caching infrastructure including CDN provider, reverse proxy layers, and cache behavior.

## Inputs

- `target-url`: Base URL of the authorized target application
- `engagement-scope`: Written authorization and scope document

## Outputs

- `cache-topology`: Map of caching layers, headers, and key construction
- `cache-behavior-profile`: Cache TTLs, vary headers, and purge behavior

## Process

1. Send requests and analyze cache-related response headers (X-Cache, Age, Via, CF-Cache-Status)
2. Identify the CDN or reverse proxy product from response signatures
3. Map cache key construction by testing which headers and parameters are keyed
4. Document cache TTL, purge behavior, and geographic distribution

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
