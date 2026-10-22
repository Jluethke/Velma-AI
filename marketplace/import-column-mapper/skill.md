# Import Column Mapper

Map the file's columns to the target system's fields, with type conversion rules.

## Inputs

- `file-profile`: File structure and detected data types
- `target-system-schema`: Target fields, types, and constraints

## Outputs

- `import-mapping`: File column to target field mapping with conversion rules
- `unmapped-columns`: File columns that do not map to any target field

## Process

1. Auto-match columns to target fields by name similarity.
2. For unmatched columns, present them for manual mapping or exclusion.
3. Define type conversion rules for each mapped pair.
4. Flag required target fields that have no source column.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
