# Cis Benchmark Testing

Test cloud configurations against CIS benchmark recommendations for the specific cloud provider.

## Inputs

- `iam-findings`: IAM audit findings
- `network-findings`: Network audit findings
- `logging-gaps`: Logging coverage gaps

## Outputs

- `benchmark-results`: Pass/fail results for each CIS benchmark control
- `compliance-score`: Overall compliance percentage and breakdown by category

## Process

1. Map the provider-specific CIS benchmark controls to testable checks.
2. Run each check against the current configuration.
3. Record pass, fail, or not-applicable for each control.
4. Calculate the compliance score by section and overall.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
