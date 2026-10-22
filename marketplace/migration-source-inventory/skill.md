# Migration Source Inventory

Inventory the source data including schemas, volumes, and dependencies.

## Inputs

- `source-system`: The source system to migrate from
- `migration-scope`: What data is in scope for migration

## Outputs

- `source-inventory`: Complete inventory of source data
- `dependency-map`: Dependencies between tables and systems

## Process

1. Catalog all tables, views, and stored procedures in scope.
2. Document row counts, data sizes, and growth rates.
3. Map foreign key and application-level dependencies.
4. Identify data that should be archived vs migrated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
