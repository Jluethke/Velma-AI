# Archive Catalog Builder

Create the catalog and finding aid for the archive.

## Inputs

- `migration-log`: Record of all migrated files
- `preservation-standard`: Metadata schema

## Outputs

- `archive-catalog`: Searchable catalog of all archived items with metadata
- `finding-aid`: Human-readable guide to what the archive contains and how to navigate it

## Process

1. Build the catalog from the migration log: one entry per file with all metadata fields populated.
2. Organize the catalog by collection, date range, and content type.
3. Write the finding aid: an overview of the archive's scope, how it is organized, and how to search it.
4. Make the catalog searchable (spreadsheet, database, or static site).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
