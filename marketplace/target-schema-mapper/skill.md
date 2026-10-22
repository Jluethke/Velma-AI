# Target Schema Mapper

Map source schemas to the target system schema.

## Inputs

- `source-inventory`: Source data inventory
- `target-system`: The target system and its schema requirements

## Outputs

- `schema-mapping-doc`: Source-to-target schema mapping
- `transformation-rules`: Data transformation rules for the migration

## Process

1. Map each source table and column to its target equivalent.
2. Define transformations for data type changes and format differences.
3. Handle schema differences (split tables, merged tables, renamed columns).
4. Document fields with no target mapping and their disposition.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
