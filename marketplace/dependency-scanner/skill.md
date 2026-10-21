# Dependency Scanner

Scan project manifests across the portfolio to inventory dependencies and their known vulnerabilities.

## Inputs

- `project-manifests`: Dependency manifests and lockfiles across projects
- `repository-inventory`: List of repositories and services in the portfolio

## Outputs

- `dependency-inventory`: Direct and transitive dependencies with versions
- `vulnerability-findings`: Known vulnerabilities matched to dependency versions

## Process

1. Parse manifests and lockfiles to resolve direct and transitive dependencies
2. Record the exact version and source for each dependency per repository
3. Match versions against vulnerability advisory data
4. Capture evidence and advisory identifiers for each finding

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
