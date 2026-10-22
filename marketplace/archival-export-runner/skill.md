# Archival Export Runner

Export the archival candidates to the archive storage, preserving data integrity.

## Inputs

- `archival-candidate-list`: Records to archive
- `archival-size-estimate`: Expected size of the archive batch

## Outputs

- `archive-location`: Where the archived data is stored (path, bucket, database)
- `export-manifest`: List of exported records with checksums for integrity verification

## Process

1. Export the records to the archive storage in a format that preserves all fields and relationships.
2. Generate checksums for each exported batch or file.
3. Record the export manifest: record IDs, export timestamp, destination, checksums.
4. Verify the export completed without errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
