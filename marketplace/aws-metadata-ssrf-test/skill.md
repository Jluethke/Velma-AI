# Aws Metadata Ssrf Test

Test for SSRF to the EC2 metadata service and IMDSv1 vs IMDSv2 enforcement.

## Inputs

- `aws-scope`: EC2 instances and web applications in scope
- `iam-inventory`: Instance roles and their permissions

## Outputs

- `metadata-ssrf-findings`: SSRF to metadata service vulnerabilities found
- `imds-configuration-report`: IMDSv1 vs IMDSv2 enforcement status across instances

## Process

1. Check IMDSv2 enforcement (HttpTokens=required) across all EC2 instances
2. Test web applications for SSRF to the metadata endpoint (169.254.169.254)
3. Attempt credential extraction from instances running IMDSv1
4. Document the permissions available through extracted instance role credentials

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
