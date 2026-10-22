# Vendor Reassessment Conductor

Conduct periodic vendor reassessments based on the schedule.

## Inputs

- `tiered-vendor-inventory`: Vendor inventory with tiers
- `reassessment-schedule`: Reassessment schedule

## Outputs

- `reassessment-results`: Results of each vendor reassessment
- `risk-changes`: Vendors with changed risk profiles

## Process

1. Identify vendors due for reassessment.
2. Collect updated information (financials, certifications, incident history).
3. Reassess against the risk criteria.
4. Flag vendors with material changes in risk profile.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
