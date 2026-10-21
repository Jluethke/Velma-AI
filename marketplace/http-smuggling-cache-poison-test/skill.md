# Http Smuggling Cache Poison Test

Test for cache poisoning through HTTP request smuggling.

## Inputs

- `crafted-payloads`: Smuggling payloads
- `routing-results`: Routing manipulation results

## Outputs

- `cache-poison-results`: Results of cache poisoning attempts
- `affected-urls`: URLs affected by cache poisoning

## Process

1. Craft smuggling payloads that inject into cached responses
2. Test for web cache deception through smuggling
3. Verify cache poisoning by fetching the affected URLs normally

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
