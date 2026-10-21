# Supply Chain Build Reproducibility

Test whether builds are reproducible to detect unauthorized modifications in the build output.

## Inputs

- `codebase-access`: Access to build configurations and CI pipeline
- `integrity-findings`: Package integrity findings

## Outputs

- `reproducibility-results`: Results of reproducible build attempts
- `build-environment-findings`: Factors preventing reproducibility (timestamps, non-determinism)

## Process

1. Attempt to rebuild from the same source and dependencies in a clean environment
2. Compare build outputs byte-for-byte or with diffoscope
3. Identify sources of non-determinism (timestamps, file ordering, non-pinned tools)
4. Assess the feasibility of achieving fully reproducible builds

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
