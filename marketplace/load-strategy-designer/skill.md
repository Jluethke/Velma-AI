# Load Strategy Designer

Define the load strategy for writing data to the target store.

## Inputs

- `transformation-logic`: Transformation implementation
- `target-schema`: Target data store schema

## Outputs

- `load-plan`: Load strategy (upsert, append, SCD type) per table
- `load-validation-rules`: Rules to validate data after loading

## Process

1. Select the load pattern per table: append, upsert, or slowly changing dimension.
2. Define the merge keys and conflict resolution rules.
3. Plan the load order to respect foreign key constraints.
4. Set up post-load validation (row counts, checksums, referential integrity).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
