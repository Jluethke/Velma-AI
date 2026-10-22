# Cmdb Audit Scheduler

Schedule and run CMDB accuracy audits.

## Inputs

- `cmdb-scope`: What the CMDB covers
- `change-tracking-policy`: Change detection rules

## Outputs

- `audit-schedule`: Recurring audit schedule by CI type
- `cmdb-management-plan`: Complete CMDB management plan with roles, processes, and metrics

## Process

1. Define the audit frequency by CI type and criticality.
2. Sample CIs and verify against physical reality.
3. Measure CMDB accuracy (percentage of CIs that match reality).
4. Document the complete CMDB management plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
