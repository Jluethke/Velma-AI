# Unkeyed Header Discovery

Identify request headers and parameters that affect the response but are not included in the cache key.

## Inputs

- `cache-topology`: Cache infrastructure map
- `cache-behavior-profile`: Cache key and TTL behavior

## Outputs

- `unkeyed-inputs`: Headers and parameters reflected in response but excluded from cache key
- `reflection-points`: Where each unkeyed input is reflected in the response body or headers

## Process

1. Test common headers (X-Forwarded-Host, X-Original-URL, X-Rewrite-URL) for reflection
2. Check for unkeyed query parameters that alter response content
3. Verify each reflection is excluded from the cache key by cache-busting
4. Classify reflection type (HTML body, redirect, header, JavaScript)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
