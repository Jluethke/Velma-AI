# Aws Iam Enumeration

Enumerate IAM roles, policies, and trust relationships in the authorized AWS account.

## Inputs

- `aws-scope`: Authorized AWS accounts, regions, and services
- `test-credentials-aws`: AWS credentials provided for the engagement

## Outputs

- `iam-inventory`: Users, roles, groups, and their attached policies
- `privilege-escalation-paths`: Identified IAM misconfigurations that could allow escalation
- `trust-relationship-map`: Role trust policies and cross-account relationships

## Process

1. Enumerate all IAM users, roles, and groups with their policy attachments
2. Analyze inline and managed policies for overly permissive actions
3. Map role trust relationships to identify assumable roles
4. Identify known privilege escalation paths (iam:PassRole, iam:CreatePolicyVersion, etc.)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
