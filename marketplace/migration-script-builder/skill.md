# Migration Script Builder

Implement and test the migration scripts.

## Inputs

- `schema-mapping-doc`: Source-to-target mapping
- `transformation-rules`: Transformation rules

## Outputs

- `migration-scripts`: Tested migration scripts
- `test-results`: Results from test runs on sample data

## Process

1. Write extraction scripts for each source table.
2. Implement transformations per the mapping rules.
3. Write load scripts for the target system.
4. Run on a representative sample and validate correctness.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
