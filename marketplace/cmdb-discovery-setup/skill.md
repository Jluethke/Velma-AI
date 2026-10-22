# Cmdb Discovery Setup

Set up automated discovery and reconciliation.

## Inputs

- `cmdb-scope`: What to discover
- `relationship-model`: Expected relationships

## Outputs

- `discovery-configuration`: Configured discovery tool settings
- `reconciliation-rules`: Rules for matching discovered CIs to existing records

## Process

1. Select and configure the discovery tool for each CI type.
2. Define the reconciliation rules (match on serial number, hostname, MAC).
3. Run the initial discovery scan and review the results.
4. Resolve any duplicates or mismatches.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
