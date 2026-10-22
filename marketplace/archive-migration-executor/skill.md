# Archive Migration Executor

Migrate files to archival format and storage.

## Inputs

- `archival-scope`: What to archive
- `preservation-standard`: Target formats and metadata requirements

## Outputs

- `migration-log`: Record of every file migrated with source path, target path, format conversion, and checksum
- `migration-exceptions`: Files that could not be migrated and require manual handling

## Process

1. Convert files to the archival format where needed (e.g., DOCX to PDF/A, JPEG to TIFF).
2. Apply the metadata to each file according to the schema.
3. Compute the SHA-256 checksum for each archived file.
4. Transfer the files to the archival storage and verify the checksums match.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
