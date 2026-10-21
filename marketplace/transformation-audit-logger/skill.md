# Transformation Audit Logger

Document every transformation applied from raw to analysis-ready, producing an audit trail that allows full reproduction.

## Inputs

- `reconciled-dataset`: the cleaned dataset
- `reconciliation-log`: coding changes
- `missingness-analysis`: imputation decisions
- `outlier-catalog`: outlier treatment decisions

## Outputs

- `analysis-ready-dataset`: final clean dataset with provenance metadata
- `cleaning-audit-trail`: complete log of every transformation, in order, with justification

## Process

1. Concatenate all transformation logs into a single ordered timeline
2. For each transformation, record: variable affected, original value(s), new value(s), reason, and rule applied
3. Attach a checksum to the final dataset for integrity verification
4. Produce a summary table: number of records in, records out, imputations, exclusions, and recodings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
