# Supply Chain Confusion Test

Test for dependency confusion and typosquatting vulnerabilities in the package resolution chain.

## Inputs

- `dependency-tree`: Dependency tree including registry sources
- `codebase-access`: Package manager configuration files

## Outputs

- `confusion-findings`: Packages vulnerable to dependency confusion or namespace attacks
- `registry-config-assessment`: Assessment of registry priority and scoping configuration

## Process

1. Identify internal package names and check for public registry availability
2. Check package manager registry priority configuration
3. Test for namespace squatting possibilities on public registries
4. Review scoped vs unscoped package usage patterns

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
