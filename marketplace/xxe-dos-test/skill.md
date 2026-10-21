# Xxe Dos Test

Test for denial of service through XML bomb (billion laughs) and recursive entity expansion.

## Inputs

- `upload-xxe-results`: Upload XXE results
- `xml-endpoints`: XML endpoints

## Outputs

- `dos-results`: XML denial-of-service test results
- `resource-limits`: Whether the parser enforces entity expansion limits

## Process

1. Send a controlled billion laughs payload with limited expansion
2. Measure memory and CPU consumption from entity expansion
3. Check whether the parser enforces depth and expansion limits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
