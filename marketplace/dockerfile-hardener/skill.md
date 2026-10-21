# Dockerfile Hardener

Remove unnecessary packages, set a non-root user, and apply Dockerfile security best practices.

## Inputs

- `selected-base-image`: Chosen base image with version tag
- `application-requirements`: Runtime requirements of the application

## Outputs

- `hardened-dockerfile`: Dockerfile following security best practices
- `removed-packages`: List of packages removed from the base and the rationale

## Process

1. Remove package managers, shells, and debugging tools not needed at runtime.
2. Add a non-root user and switch to it before the ENTRYPOINT.
3. Pin dependency versions and use multi-stage builds to exclude build tools from the final image.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
