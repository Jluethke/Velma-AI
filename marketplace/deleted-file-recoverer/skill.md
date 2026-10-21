# Deleted File Recoverer

Recover deleted files from a mounted forensic image using carving and metadata analysis.

## Inputs

- `mounted-filesystem`: The read-only mounted filesystem
- `recovery-config`: File types to target and carving parameters

## Outputs

- `recovered-files`: Collection of recovered deleted files
- `recovery-log`: Log of recovery operations and file metadata

## Process

1. Scan the unallocated space for file signatures
2. Carve files using header and footer matching
3. Recover files from orphaned MFT or inode entries
4. Catalog each recovered file with metadata

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
