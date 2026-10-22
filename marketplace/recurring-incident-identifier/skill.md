# Recurring Incident Identifier

Identify recurring incidents that indicate an underlying problem.

## Inputs

- `incident-data`: Incident records from the service desk
- `threshold-criteria`: How many recurrences qualify as a problem

## Outputs

- `problem-candidates`: Incidents that recur above the threshold
- `pattern-analysis`: Commonalities across the recurring incidents

## Process

1. Query incident records for clusters by category, CI, or symptom.
2. Identify patterns that exceed the recurrence threshold.
3. Group related incidents into candidate problems.
4. Rank by business impact and frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
