# Nosql Blind Timing Test

Test for blind NoSQL injection through timing-based inference attacks.

## Inputs

- `js-injection-results`: JavaScript injection results
- `vulnerable-params`: Parameters known to be vulnerable

## Outputs

- `blind-injection-results`: Blind timing injection test results
- `extracted-data-samples`: Data samples extracted through blind techniques

## Process

1. Inject conditional sleep payloads to confirm blind injection
2. Use binary search through timing to extract field values
3. Measure response times across multiple attempts for reliability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
