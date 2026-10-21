# Dockerfile Security Check

Check Dockerfiles for insecure patterns including running as root, hardcoded secrets, and unnecessary packages.

## Inputs

- `image-list`: Images to check
- `image-vulnerabilities`: Known vulnerabilities for context

## Outputs

- `dockerfile-findings`: Insecure patterns found in Dockerfiles
- `hardening-recommendations`: Specific changes to harden each Dockerfile

## Process

1. Check for USER directive to confirm the container does not run as root.
2. Scan for hardcoded secrets, tokens, and credentials in build arguments and environment variables.
3. Verify that only necessary packages are installed (no build tools in production images).
4. Check for proper use of multi-stage builds to minimize the attack surface.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
