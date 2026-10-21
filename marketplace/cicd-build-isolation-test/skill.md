# Cicd Build Isolation Test

Test whether one build job can access artifacts, environment, or secrets belonging to another build job.

## Inputs

- `pipeline-inventory`: Catalog of pipelines and their configurations
- `secrets-findings`: Known secret locations from the scan phase

## Outputs

- `isolation-results`: Findings on build-to-build access and shared resource risks
- `shared-resource-map`: Map of shared runners, caches, volumes, and artifacts across pipelines

## Process

1. Test whether shared runners allow cross-build file system access
2. Check if build caches can be poisoned by one pipeline and consumed by another
3. Verify that secret scoping prevents cross-pipeline access
4. Test artifact storage isolation between projects

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
