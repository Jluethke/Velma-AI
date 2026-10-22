# Sync Direction Configurator

Define whether the sync runs one-way (spreadsheet to database or database to spreadsheet) or bidirectionally, and set the conflict resolution policy.

## Inputs

- `field-mapping`: Column-to-field mapping from the schema mapper
- `sync-requirements`: Business rules for which system is the source of truth and how conflicts should resolve

## Outputs

- `sync-direction`: One-way or bidirectional, with the designated source of truth
- `conflict-policy`: Rules for handling conflicts (last-write-wins, source-wins, manual review)

## Process

1. Determine which system is the primary source of truth for each field.
2. Choose one-way sync if one system always owns the data, bidirectional if both systems create or update records.
3. Define the conflict resolution policy for overlapping updates.
4. Document the sync direction and conflict rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
