# Integration Test Planner

Plan the integration test suite: what to test and how.

## Inputs

- `api-spec`: The API specification or documentation
- `integration-points`: The systems and services the API integrates with

## Outputs

- `test-plan`: The test plan: test categories (contract, functional, error handling, performance), test cases per endpoint
- `test-environment-requirements`: What the test environment needs (mock services, test data, credentials)

## Process

1. List every integration point (external APIs, databases, message queues, file systems).
2. For each endpoint, define test cases: happy path, edge cases, error responses, authentication failures.
3. Define contract tests: verify the API response matches the documented schema.
4. Define the test environment requirements: test credentials, mock services, seed data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
