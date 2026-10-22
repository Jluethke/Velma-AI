# Archival Record Identifier

Query the active system to identify records that match the archival criteria.

## Inputs

- `archival-criteria`: Rules defining archival eligibility
- `exclusion-rules`: Records to exclude from archival

## Outputs

- `archival-candidate-list`: List of records eligible for archival with key fields and counts
- `archival-size-estimate`: Estimated storage size of the archival batch

## Process

1. Run the archival criteria query against the active system.
2. Apply the exclusion rules to remove ineligible records.
3. Summarize the candidate list: record count by type, date range, and estimated storage size.
4. Review the candidate list for anything unexpected before proceeding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
