# Nexus Determiner

Determine sales tax nexus in each jurisdiction based on physical presence and economic activity.

## Inputs

- `business-activities`: Business operations, locations, and sales by state
- `nexus-thresholds`: Economic nexus thresholds by jurisdiction

## Outputs

- `nexus-assessment`: Jurisdictions where the business has nexus
- `registration-requirements`: Registration actions needed in new jurisdictions

## Process

1. Identify physical presence (offices, warehouses, employees) by jurisdiction.
2. Calculate economic activity (revenue, transaction count) against thresholds.
3. Determine nexus status for each jurisdiction.
4. Identify jurisdictions requiring new registrations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
