# Environment Cataloger

Catalog the computational environment required to reproduce the analysis: software, packages, versions, hardware, and operating system.

## Inputs

- `published-paper`: the paper being audited
- `supplementary-materials`: code, data, and environment files if available

## Outputs

- `environment-specification`: complete software and hardware environment with versions
- `availability-assessment`: what is available (code, data, environment) vs what is missing

## Process

1. Extract software, package, and version information from the paper, supplements, and any lockfiles
2. Check whether the code repository, data repository, and environment specification (Dockerfile, conda env, renv.lock) are publicly available
3. Note any proprietary software, restricted data, or specialized hardware required
4. Classify the study as fully reproducible, partially reproducible, or opaque based on material availability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
