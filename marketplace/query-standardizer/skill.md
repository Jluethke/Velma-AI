# Query Standardizer

Write standardized, tested versions of each query.

## Inputs

- `query-inventory`: Raw queries collected from analysts
- `duplication-map`: Duplicate queries to consolidate

## Outputs

- `standardized-queries`: Clean, tested, documented queries
- `test-results`: Validation that each query returns expected results

## Process

1. For each unique purpose, write one canonical query.
2. Add parameters for common variations (date range, segment, region).
3. Test each query against known data and verify results.
4. Add performance notes (expected runtime, index usage).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
