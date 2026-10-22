# Sdk Requirements Definer

Define which languages to support and what the SDK should include.

## Inputs

- `api-spec`: The OpenAPI specification
- `target-languages`: Languages to generate SDKs for (Python, JavaScript, Go, Java, Ruby, etc.)
- `consumer-needs`: What consumers need from the SDK beyond raw API calls

## Outputs

- `sdk-requirements`: Requirements per language: HTTP client, authentication handling, error types, pagination helpers, retry logic
- `sdk-style-guide`: Naming conventions and patterns for each language (following language idioms)

## Process

1. For each target language, define the idiomatic patterns (Python: snake_case, type hints; JS: camelCase, Promises).
2. Define the SDK features beyond raw calls: authentication wrappers, pagination iterators, retry with backoff, typed errors.
3. Define the packaging and distribution method for each language (PyPI, npm, Maven, etc.).
4. Define the minimum supported language versions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
