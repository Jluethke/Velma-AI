# Api Example Builder

Build request and response examples for each endpoint.

## Inputs

- `openapi-spec`: The validated OpenAPI specification
- `api-endpoints`: The endpoint list for context

## Outputs

- `endpoint-examples`: Request and response examples for every endpoint, including error cases
- `code-snippets`: Code snippets in 3+ languages (curl, Python, JavaScript) for each endpoint

## Process

1. For each endpoint, write a realistic request example with valid data.
2. Write the corresponding success response example.
3. Write error response examples for common error codes (400, 401, 403, 404, 429, 500).
4. Generate code snippets in curl, Python, and JavaScript for each endpoint.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
