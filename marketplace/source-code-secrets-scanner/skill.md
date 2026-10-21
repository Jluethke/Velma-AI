# Source Code Secrets Scanner

Scan source code repositories, config files, CI/CD pipelines, and container images for exposed secrets.

## Inputs

- `repo-list`: List of repositories and config file locations to scan
- `secrets-inventory`: Known secrets inventory for pattern matching

## Outputs

- `exposed-secrets-report`: Secrets found in source code, config, and CI/CD
- `historical-exposure-list`: Secrets found in git history that may have been rotated

## Process

1. Run pattern-based scanning (truffleHog, git-secrets, or detect-secrets) on all repositories
2. Scan git history for secrets that were committed and later removed
3. Check CI/CD pipeline definitions for hardcoded secrets or insecure variable usage
4. Scan container images for baked-in secrets or credentials

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
