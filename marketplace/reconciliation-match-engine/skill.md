# Reconciliation Match Engine

Match records between the two datasets using the defined keys and flag discrepancies.

## Inputs

- `dataset-a`: Normalized dataset from system A
- `dataset-b`: Normalized dataset from system B

## Outputs

- `matched-records`: Records that matched on the key fields, with any field-level differences noted
- `discrepancy-list`: Unmatched and mismatched records, classified by type (missing in A, missing in B, value mismatch)

## Process

1. Define the matching keys (transaction ID, date plus amount, or composite key).
2. Run the match: inner join on keys to find matched records, outer join to find unmatched.
3. For matched records, compare every non-key field and flag differences.
4. Classify discrepancies: missing in A, missing in B, or present in both with value mismatch.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
