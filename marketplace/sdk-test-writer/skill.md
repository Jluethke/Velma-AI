# Sdk Test Writer

Write tests for the generated SDKs.

## Inputs

- `generated-sdks`: The generated SDK code
- `sdk-requirements`: Requirements to test against

## Outputs

- `sdk-tests`: Test suite for each SDK: unit tests, integration tests, example scripts
- `sdk-examples`: Example code showing common use cases in each language

## Process

1. Write unit tests for authentication, error handling, pagination, and retry logic.
2. Write integration tests against a test API instance.
3. Write example scripts showing the most common 5 to 10 use cases.
4. Verify each SDK installs from its package manager and runs the examples.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
