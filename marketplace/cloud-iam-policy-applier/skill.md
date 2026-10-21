# Cloud Iam Policy Applier

Apply least-privilege IAM policies to all users and service accounts.

## Inputs

- `cloud-provider`: Cloud provider
- `audit-log-config`: Audit logging to monitor IAM changes

## Outputs

- `iam-policies`: Applied IAM policies with their scope
- `iam-review-log`: Record of privilege changes made during the review

## Process

1. Inventory all IAM users, groups, roles, and service accounts
2. Remove unused accounts and access keys
3. Apply least-privilege policies based on actual usage (use access analyzer tools)
4. Enforce a maximum key age and rotation policy

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
