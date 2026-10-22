# Api Docs Publisher

Publish the documentation and set up the update process.

## Inputs

- `openapi-spec`: The API specification
- `endpoint-examples`: The examples
- `getting-started-guide`: The getting started guide
- `auth-guide`: The authentication guide

## Outputs

- `published-docs`: The published documentation site with search, navigation, and try-it-out functionality
- `docs-maintenance-plan`: The plan for keeping docs in sync with code changes

## Process

1. Choose the documentation hosting solution (Swagger UI, Redoc, ReadMe, custom).
2. Generate the documentation site from the spec and supplementary guides.
3. Set up the CI pipeline to regenerate docs on spec changes.
4. Document the update process for the team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
