# Base Image Selector

Select a minimal base image appropriate for the application with the smallest possible attack surface.

## Inputs

- `application-requirements`: Runtime requirements of the application (language, libraries, OS dependencies)
- `security-policy`: Organizational policy on approved base images and registries

## Outputs

- `selected-base-image`: Chosen base image with version tag and registry source
- `image-justification`: Rationale for the choice including alternatives considered

## Process

1. List the application's minimum runtime dependencies.
2. Compare candidate base images (distroless, Alpine, slim variants) by size and installed packages.
3. Select the smallest image that meets all runtime requirements and complies with policy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
