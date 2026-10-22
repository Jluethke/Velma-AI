# Migration Integrity Validator

Validate data integrity after migration.

## Inputs

- `migration-scripts`: The migration scripts to validate
- `source-inventory`: Source data for comparison

## Outputs

- `validation-results`: Row counts, checksums, and spot check results
- `discrepancy-report`: Any discrepancies found and their resolution

## Process

1. Compare row counts between source and target for every table.
2. Compute checksums on key columns and compare.
3. Run spot checks on random samples comparing field values.
4. Verify referential integrity in the target system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
