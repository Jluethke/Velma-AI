# Attack Surface Risk Prioritizer

Prioritize attack surface risks by exploitability, exposure, and business criticality.

## Inputs

- `discovered-assets`: Full asset list with fingerprints
- `shadow-it-list`: Untracked and orphaned assets
- `change-alerts`: Recent changes

## Outputs

- `prioritized-risks`: Assets ranked by risk (exploitability times exposure times business impact)
- `remediation-actions`: Specific action for each high-risk asset (patch, decommission, restrict access, transfer to managed infrastructure)

## Process

1. Score each asset by exploitability (known CVEs, weak TLS, default credentials)
2. Factor in exposure (internet-facing, no WAF, no authentication)
3. Weight by business criticality (customer-facing, data sensitivity, revenue impact)
4. Assign a remediation action and owner for each high-risk asset

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
