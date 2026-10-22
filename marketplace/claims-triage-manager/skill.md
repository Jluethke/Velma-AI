# Claims Triage Manager

Triage incoming catastrophe claims by severity and fast-track emergency payments.

## Inputs

- `deployment-plan`: Field deployment and territory assignments
- `temporary-operations`: Active temporary operations

## Outputs

- `triaged-claims`: Claims categorized by severity (total loss, major, minor) with assigned adjusters
- `emergency-payments`: Emergency advance payments issued to policyholders with immediate needs

## Process

1. Receive and log incoming claims through all channels (phone, web, field, agent).
2. Triage each claim by severity: total loss, major damage, minor damage.
3. Issue emergency advance payments for policyholders with immediate living or business needs.
4. Assign claims to field adjusters based on territory and severity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
