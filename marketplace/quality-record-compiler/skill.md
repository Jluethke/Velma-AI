# Quality Record Compiler

Produce the quality inspection record with metrics.

## Inputs

- `non-conformance-reports`: NCRs issued
- `inspection-results`: All inspection results

## Outputs

- `quality-inspection-record`: Complete quality inspection record
- `quality-metrics`: Metrics on inspection pass rate, NCR volume, and resolution time

## Process

1. Compile all inspection results and NCRs into the quality record.
2. Calculate metrics (pass rate, NCR count, average resolution time).
3. Identify trends in non-conformance types.
4. File the record in the project quality files.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
