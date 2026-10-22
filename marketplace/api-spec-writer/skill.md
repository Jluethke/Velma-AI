# Api Spec Writer

Write or update the API specification in OpenAPI format.

## Inputs

- `api-endpoints`: List of API endpoints with methods, paths, and descriptions
- `data-models`: The request and response data models

## Outputs

- `openapi-spec`: The OpenAPI 3.x specification document
- `spec-validation-results`: Validation results confirming the spec is valid and complete

## Process

1. Write the info section (title, version, description, contact, license).
2. Define the paths: each endpoint with method, parameters, request body, responses, and error codes.
3. Define the components: schemas for request and response objects, security schemes, common parameters.
4. Validate the spec against the OpenAPI specification and fix any errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
