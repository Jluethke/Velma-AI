# Reconciliation Dataset Extractor

Extract the datasets from both systems for comparison, normalizing formats and timestamps.

## Inputs

- `system-a-connection`: Connection details and query for the first system
- `system-b-connection`: Connection details and query for the second system

## Outputs

- `dataset-a`: Extracted and normalized dataset from system A
- `dataset-b`: Extracted and normalized dataset from system B

## Process

1. Connect to system A and extract the dataset for the reconciliation period.
2. Connect to system B and extract the corresponding dataset.
3. Normalize both datasets to a common format (date formats, currency, identifiers).
4. Verify row counts and date ranges match the expected scope.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
