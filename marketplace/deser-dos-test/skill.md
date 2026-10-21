# Deser Dos Test

Test for denial of service through deeply nested or recursive serialized objects.

## Inputs

- `deserialization-endpoints`: Endpoints accepting serialized data
- `type-confusion-results`: Type confusion test results

## Outputs

- `deser-dos-results`: Denial of service results from nested or oversized payloads
- `resource-exhaustion-metrics`: Memory and CPU impact measurements

## Process

1. Craft deeply nested object structures (billion laughs equivalent)
2. Test with extremely large serialized payloads to exhaust memory
3. Measure server response time degradation under malicious payloads
4. Check for object graph cycle detection and depth limits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
