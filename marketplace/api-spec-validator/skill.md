# Api Spec Validator

Validate and normalize the API specification for SDK generation.

## Inputs

- `api-spec`: OpenAPI or similar API specification file
- `target-languages`: Which programming languages to generate SDKs for

## Outputs

- `validated-spec`: API specification that passes validation and is ready for code generation
- `spec-issues`: Any issues found and resolved in the specification

## Process

1. Run the specification through a validator (OpenAPI linter or equivalent).
2. Fix any errors or inconsistencies.
3. Normalize naming conventions for SDK-friendly code generation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
