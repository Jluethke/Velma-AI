# Api Example Generator

Generate request and response examples for each endpoint.

## Inputs

- `endpoint-catalog`: Full endpoint listing with schemas

## Outputs

- `example-requests`: Sample request for each endpoint with realistic data
- `example-responses`: Sample success and error responses for each endpoint

## Process

1. For each endpoint, create a sample request with realistic parameter values.
2. Generate the expected success response matching the response schema.
3. Generate common error responses (400, 401, 404, 500) with error message format.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
