# Gcp Cross Project Trust Test

Test for cross-project trust abuse through shared VPCs, service account impersonation, and organization policies.

## Inputs

- `iam-binding-map`: Cross-project IAM bindings to test
- `extracted-tokens`: Tokens to test cross-project access
- `leaked-key-findings`: Keys that may work across projects

## Outputs

- `cross-project-findings`: Cross-project trust abuse paths
- `gcp-pentest-report`: Final GCP penetration test report with all findings

## Process

1. Map shared VPC configurations and cross-project network access
2. Test service account impersonation across project boundaries
3. Check for organization policy bypasses and constraint violations
4. Compile all findings into the GCP penetration test report with remediation priorities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
