# Cost Tagging Implementer

Implement resource tagging for cost allocation by team, project, and environment.

## Inputs

- `cloud-accounts`: Cloud accounts to tag
- `billing-data`: Current billing data for context

## Outputs

- `tagging-policy`: Required tags and their allowed values
- `tagging-compliance`: Current compliance rate and untagged resources

## Process

1. Define the required tags (team, project, environment, cost center)
2. Audit current tagging compliance across all resources
3. Tag untagged resources and enforce tagging in IaC and provisioning
4. Set up tag-based cost allocation reports

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
