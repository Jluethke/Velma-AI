# Reconciled List Updater

Update the official medication list with all resolutions.

## Inputs

- `resolved-actions`: Decisions for each discrepancy
- `matched-medications`: Confirmed medications

## Outputs

- `reconciled-med-list`: Final reconciled medication list
- `change-summary`: Summary of all changes made during reconciliation

## Process

1. Apply each resolution to the medication list.
2. Update the EHR with the reconciled list.
3. Generate a change summary for the medical record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
