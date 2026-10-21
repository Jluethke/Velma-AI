# Api Input Validation Designer

Design input validation and output encoding rules for all API endpoints.

## Inputs

- `api-surface`: Endpoints, methods, and schemas
- `authn-design`: Authentication design for the API

## Outputs

- `validation-rules`: Input validation rules per field: type, length, format, allowed values
- `output-encoding-rules`: Output encoding and filtering rules per response type

## Process

1. Define validation rules for each input field: type constraints, length limits, format patterns, allowed character sets.
2. Define output encoding rules to prevent injection in each response content type.
3. Document rejection behavior for invalid inputs (error codes, messages without information disclosure).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
