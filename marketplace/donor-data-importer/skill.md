# Donor Data Importer

Import existing donor records into the new system with validation and deduplication.

## Inputs

- `data-migration-map`: Mapping from existing sources to the new model
- `crm-recommendation`: Selected CRM platform

## Outputs

- `import-report`: Summary of records imported, skipped, and flagged
- `clean-donor-database`: Validated and deduplicated donor records

## Process

1. Extract data from all existing sources
2. Clean and standardize records (address formatting, name parsing)
3. Deduplicate using matching rules (name, email, address)
4. Import into the selected system and verify record counts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
