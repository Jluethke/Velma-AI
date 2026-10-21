# Api Surface Definer

Define the API surface, resources, and data models.

## Inputs

- `product-requirements`: Functional requirements the API must satisfy
- `data-models`: Domain data models and their relationships

## Outputs

- `api-surface`: List of endpoints, HTTP methods, request/response schemas
- `resource-sensitivity`: Sensitivity classification for each resource and field

## Process

1. Map product requirements to REST resources and operations.
2. Define request and response schemas for each endpoint.
3. Classify each resource and field by sensitivity for downstream access control decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
