# Result Comparator

Compare every reproduced result (figure, table, statistic) against the published version.

## Inputs

- `reproduced-outputs`: re-execution results
- `published-paper`: the published tables, figures, and statistics

## Outputs

- `comparison-table`: per-result comparison: published value, reproduced value, match (exact/approximate/mismatch)
- `discrepancy-list`: results that do not match, with the magnitude of difference

## Process

1. Extract every reported number, table entry, and figure from the published paper
2. Match each to its reproduced counterpart
3. Classify each comparison as exact match, approximate match (within rounding), or mismatch
4. For mismatches, compute the magnitude of difference (absolute and relative)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
