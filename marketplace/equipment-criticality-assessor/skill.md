# Equipment Criticality Assessor

Inventory equipment and assess criticality.

## Inputs

- `equipment-list`: List of all production and support equipment
- `production-requirements`: Production schedules and capacity needs

## Outputs

- `criticality-ranking`: Equipment ranked by impact of failure
- `equipment-registry`: Master equipment registry with IDs and locations

## Process

1. Catalog all equipment with unique identifiers
2. Assess each for failure impact on safety, quality, output, and cost
3. Classify as critical (A), important (B), or general (C)
4. Prioritize maintenance effort by criticality class

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
