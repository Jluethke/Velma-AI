# Integration Test Writer

Write the integration test cases.

## Inputs

- `test-plan`: The test plan with test cases
- `api-spec`: The API specification

## Outputs

- `test-suite`: The written test suite organized by endpoint and test category
- `test-data-fixtures`: Test data fixtures for each test case

## Process

1. Write contract tests that validate response schemas against the OpenAPI spec.
2. Write functional tests for each endpoint's happy path.
3. Write error handling tests (invalid input, missing auth, rate limiting, server errors).
4. Create the test data fixtures needed for each test case.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
