# Data Retention Policy Definer

Set retention policies by data type to meet compliance, forensic, and cost requirements.

## Inputs

- `source-catalog`: All data sources and their compliance requirements
- `cost-model`: Storage cost per tier

## Outputs

- `retention-policies`: Retention period and tier for each data type
- `lifecycle-rules`: Automated rules to move data between tiers and delete at end of life

## Process

1. Map each data type to its compliance retention requirement (PCI: 1 year, HIPAA: 6 years)
2. Set retention to the maximum of compliance and forensic needs
3. Define lifecycle transitions: hot to warm at 30 days, warm to cold at 1 year
4. Configure automated deletion at end of retention

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
