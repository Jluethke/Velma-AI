# Merge Data Preparer

Prepare the data source with clean, validated merge fields.

## Inputs

- `contact-list`: The raw contact list or data source for the merge
- `merge-fields`: The fields needed for the merge (name, address, account number, custom fields)

## Outputs

- `clean-data-source`: Validated and formatted data source ready for merge
- `data-quality-report`: Count of records, missing fields, duplicates removed

## Process

1. Import the contact list and map columns to merge fields.
2. Validate each record for completeness (no missing required fields).
3. Standardize formatting (names, addresses, dates).
4. Remove duplicates and produce the data quality report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
