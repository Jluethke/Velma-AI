# Supply Chain Update Practices

Assess dependency update practices including automation, review, and response time to security advisories.

## Inputs

- `dependency-metadata`: Dependency metadata including update history
- `vulnerability-report`: Known vulnerability findings

## Outputs

- `update-practice-assessment`: Assessment of how quickly and thoroughly dependencies are updated
- `stale-dependencies`: List of dependencies significantly behind their latest versions

## Process

1. Measure the lag between dependency security releases and adoption in the codebase
2. Check for automated dependency update tooling (Dependabot, Renovate)
3. Review the dependency update review and merge process
4. Identify dependencies pinned to end-of-life or unsupported versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
