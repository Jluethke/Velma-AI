# Sdk Test And Publish

Test each SDK against the API and prepare for publishing.

## Inputs

- `generated-sdks`: SDK code for each language
- `customization-notes`: What was customized

## Outputs

- `test-results`: SDK test results against the live or staging API
- `sdk-packages`: Packaged SDKs ready for distribution

## Process

1. Write integration tests for each SDK: authentication, CRUD operations, error handling.
2. Run tests against the staging API.
3. Package each SDK for its language's package manager.
4. Write the README for each SDK: installation, authentication, basic usage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
