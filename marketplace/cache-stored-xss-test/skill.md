# Cache Stored Xss Test

Test for stored XSS delivered through poisoned cache entries.

## Inputs

- `poison-payloads`: Crafted poisoning payloads
- `cache-behavior-profile`: Cache TTL and purge information

## Outputs

- `stored-xss-results`: Results of stored XSS through cache poisoning attempts
- `xss-evidence`: Screenshots and HTTP traces proving XSS execution

## Process

1. Send the poison request with a cache-buster to isolate the test
2. Verify the poisoned response is cached by requesting the same URL
3. Confirm the XSS payload fires in a clean browser session
4. Document the TTL and blast radius of the poisoned entry

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
