# Discrepancy Investigator

Investigate each discrepancy to determine the cause and resolution.

## Inputs

- `discrepancy-list`: Classified list of unmatched and mismatched records
- `matched-records`: Successfully matched records for reference

## Outputs

- `investigation-results`: Cause and resolution for each discrepancy (timing, data entry error, system bug, legitimate difference)
- `correction-actions`: List of corrections to apply in each system to resolve the discrepancies

## Process

1. For missing records, check whether the record was created after the extraction cutoff (timing issue) or is genuinely absent.
2. For value mismatches, trace the data back to the original entry or transaction to identify the correct value.
3. Classify each discrepancy cause: timing, data entry error, system bug, rounding, or legitimate difference.
4. Define the correction action for each resolvable discrepancy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
