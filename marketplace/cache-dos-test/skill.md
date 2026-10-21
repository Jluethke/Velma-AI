# Cache Dos Test

Test for denial of service through cache poisoning with error responses or malformed content.

## Inputs

- `cache-topology`: Cache infrastructure details
- `stored-xss-results`: XSS results for combined impact assessment

## Outputs

- `cache-dos-results`: Results of denial of service through cache poisoning
- `dos-impact-assessment`: Impact rating for each DoS vector

## Process

1. Test whether error responses (4xx, 5xx) are cached through poisoned requests
2. Check for cache deception (caching responses for non-cacheable resources)
3. Test for fat GET request poisoning that changes cached content
4. Assess the scope: single URL, path prefix, or entire domain affected

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
