# Import Preview Runner

Preview a sample of the import to catch errors before running the full batch.

## Inputs

- `import-mapping`: Column-to-field mapping with conversions
- `import-file`: The file to import

## Outputs

- `preview-results`: First N records as they would appear in the target, with any conversion warnings
- `preview-errors`: Records that failed validation during preview

## Process

1. Apply the mapping and conversion rules to the first 10-50 records.
2. Display the transformed records as they would appear in the target system.
3. Flag any records that fail validation (type errors, constraint violations, required fields null).
4. Ask for confirmation before proceeding to the full import.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
