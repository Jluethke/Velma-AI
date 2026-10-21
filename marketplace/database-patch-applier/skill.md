# Database Patch Applier

Apply the latest security patches to the database server.

## Inputs

- `database-type`: Database product and version (MySQL, PostgreSQL, Oracle, SQL Server, etc.)
- `current-patch-level`: Current patch version installed

## Outputs

- `patch-report`: List of patches applied with dates
- `updated-version`: Database version after patching

## Process

1. Check the vendor advisory page for available security patches
2. Test patches in a non-production environment first
3. Apply the patches and restart the database service
4. Verify the database is operational after patching

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
