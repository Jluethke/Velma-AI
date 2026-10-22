# Import Verification Checker

Verify the imported data by comparing counts, spot-checking records, and running integrity checks.

## Inputs

- `import-summary`: Counts of processed, succeeded, and failed records
- `error-log`: Detail on failed records

## Outputs

- `verification-report`: Comparison of source file row count to target record count, spot-check results, and integrity check results
- `import-record`: Complete import record: file, mapping, preview, execution summary, verification, and error log

## Process

1. Compare the source file row count to the target system record count for this import.
2. Spot-check a random sample of records for field-level accuracy.
3. Run referential integrity checks if the imported data references other tables.
4. Compile the complete import record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
