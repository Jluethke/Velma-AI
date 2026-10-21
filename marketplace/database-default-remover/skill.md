# Database Default Remover

Remove default databases, sample schemas, and default accounts.

## Inputs

- `database-type`: Database product type
- `updated-version`: Database version after patching

## Outputs

- `removed-defaults`: List of default items removed
- `remaining-objects`: Inventory of remaining databases and accounts

## Process

1. Remove or rename sample databases (test, world, sakila, scott, etc.)
2. Remove anonymous or default user accounts
3. Change the default administrator password if not already set
4. Verify that no default objects remain accessible

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
