# Sdk Release Planner

Plan the SDK release process and versioning.

## Inputs

- `sdk-tests`: The test suites
- `generated-sdks`: The SDK code
- `sdk-examples`: The example code

## Outputs

- `release-process`: The release process: version bumping, changelog, package publishing, announcement
- `sdk-plan`: The complete SDK plan covering generation, testing, release, and maintenance

## Process

1. Define the versioning scheme (semantic versioning, tied to API version).
2. Set up the CI pipeline: on API spec change, regenerate SDKs, run tests, publish if tests pass.
3. Define the release checklist: update changelog, bump version, publish to package registry, update docs.
4. Document the maintenance process: who monitors issues, response time, backport policy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
