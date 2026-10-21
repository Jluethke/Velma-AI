# Api Error Handling Designer

Design error handling that provides useful feedback without disclosing internal details.

## Inputs

- `api-surface`: Endpoints, methods, and schemas
- `validation-rules`: Input validation rules per field

## Outputs

- `error-response-format`: Standardized error response format with safe messages
- `error-catalog`: Catalog of error codes, their meanings, and their safe external messages

## Process

1. Define a consistent error response format (error code, safe message, request ID for support).
2. Map internal exceptions to external error codes without exposing stack traces, SQL queries, or internal paths.
3. Catalog all error codes with internal and external descriptions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
