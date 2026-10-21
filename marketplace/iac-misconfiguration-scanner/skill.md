# Iac Misconfiguration Scanner

Review infrastructure-as-code templates (Terraform, CloudFormation, Helm) for security misconfigurations.

## Inputs

- `iac-repo`: Repository containing IaC templates
- `mtls-findings`: Known mesh findings for cross-reference

## Outputs

- `iac-findings`: Security misconfigurations found in IaC templates
- `drift-analysis`: Differences between declared and actual infrastructure state

## Process

1. Run IaC scanning tools (Checkov, tfsec, KICS) on all template files
2. Check for public S3 buckets, open security groups, and permissive IAM policies
3. Verify that Kubernetes pod security standards are enforced (no privileged containers)
4. Compare deployed state against declared IaC to detect drift

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
