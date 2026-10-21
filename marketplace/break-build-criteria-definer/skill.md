# Break Build Criteria Definer

Define and document the break-build criteria that determine when security findings block a release.

## Inputs

- `reporting-config`: Reporting integration configuration
- `tuning-metrics`: False positive and true positive rates

## Outputs

- `break-build-policy`: Policy document specifying which findings block builds and which are advisory
- `security-testing-plan`: Complete automated security testing plan covering tools, pipeline, tuning, reporting, and criteria

## Process

1. Define which severity levels and finding categories must block the build.
2. Specify the exception process for urgent releases when a finding is a false positive or accepted risk.
3. Compile the full automated security testing plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
