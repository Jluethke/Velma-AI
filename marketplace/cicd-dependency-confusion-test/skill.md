# Cicd Dependency Confusion Test

Test for dependency confusion attacks where internal package names can be hijacked from public registries.

## Inputs

- `pipeline-inventory`: Catalog of pipelines with dependency sources
- `scope-definition`: In-scope repositories and package registries

## Outputs

- `confusion-findings`: List of packages vulnerable to dependency confusion or typosquatting
- `registry-config-assessment`: Assessment of registry priority, scoping, and pinning practices

## Process

1. Identify all internal package names and their registries
2. Check if public registries are searched before private ones
3. Test whether name squatting on public registries would override internal packages
4. Review version pinning and lock file practices

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
