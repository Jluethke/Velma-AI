# Iam Policy Audit

Audit IAM policies, roles, and users for overly permissive access, unused credentials, and violations of least privilege.

## Inputs

- `resource-inventory`: Inventory of all cloud resources
- `cloud-provider`: Cloud platform identifier

## Outputs

- `iam-findings`: List of IAM policy violations and overly permissive roles
- `unused-credentials`: Credentials and access keys that have not been used recently

## Process

1. List all IAM users, roles, groups, and their attached policies.
2. Identify policies with wildcard permissions (*, Resource: *).
3. Check for unused credentials and access keys older than 90 days.
4. Verify that MFA is required for privileged operations and console access.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
