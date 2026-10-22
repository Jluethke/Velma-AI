# Migration Strategy Designer

Design the migration strategy (big bang, phased, or parallel run).

## Inputs

- `dependency-map`: Data dependencies
- `downtime-budget`: Maximum acceptable downtime

## Outputs

- `migration-strategy`: Selected strategy with phase plan
- `rollback-plan`: Plan to roll back if migration fails

## Process

1. Evaluate big bang vs phased vs parallel run based on risk tolerance and downtime.
2. If phased, define the migration order respecting dependencies.
3. Plan the data sync mechanism during parallel run (if applicable).
4. Design the rollback procedure for each phase.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
