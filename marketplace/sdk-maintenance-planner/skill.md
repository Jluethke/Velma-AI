# Sdk Maintenance Planner

Set up the SDK update process for when the API changes.

## Inputs

- `test-results`: SDK test validation
- `sdk-packages`: Published packages

## Outputs

- `sdk-update-process`: How SDKs are regenerated when the API changes
- `sdk-generation-doc`: Complete SDK generation and maintenance documentation

## Process

1. Set up a CI pipeline that regenerates SDKs when the API spec changes.
2. Define the versioning strategy for SDKs relative to the API version.
3. Document the full process: generation, customization, testing, publishing, maintenance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
