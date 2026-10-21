# Cache Poison Payload Crafting

Craft cache poisoning payloads targeting each identified unkeyed input and reflection point.

## Inputs

- `unkeyed-inputs`: Unkeyed headers and parameters
- `reflection-points`: Where inputs are reflected

## Outputs

- `poison-payloads`: Crafted payloads for each unkeyed input and reflection point
- `payload-test-plan`: Testing sequence to minimize impact on production cache

## Process

1. Build XSS payloads for HTML body reflections
2. Build redirect payloads for Host header reflections
3. Build header injection payloads for response header reflections
4. Design a safe testing sequence using cache-buster parameters

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
