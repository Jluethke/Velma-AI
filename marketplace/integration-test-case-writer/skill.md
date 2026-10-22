# Integration Test Case Writer

Write test cases for each integration point.

## Inputs

- `integration-map`: All integration points documented
- `test-priority-ranking`: Which integrations to test first

## Outputs

- `test-cases`: Test cases covering success, failure, timeout, and data validation for each integration
- `test-data-requirements`: What test data is needed and how to generate or obtain it

## Process

1. For each integration, write test cases: successful data exchange, authentication failure, timeout, malformed data, rate limiting.
2. Define the expected behavior for each case.
3. Identify the test data needed: realistic payloads, edge cases, boundary values.
4. Document how to obtain or generate each test dataset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
