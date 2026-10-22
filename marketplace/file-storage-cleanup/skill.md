# File Storage Cleanup

Clean up file storage across desktop, downloads, and cloud drives.

## Inputs

- `storage-locations`: Folders and drives to clean (desktop, downloads, cloud)
- `subscription-list`: Email audit results for context

## Outputs

- `file-inventory`: Organized file structure with deleted and archived counts
- `folder-structure`: New folder organization system

## Process

1. Empty the downloads folder (delete or sort into proper locations).
2. Clean the desktop to under 10 items.
3. Organize cloud storage into a consistent folder structure.
4. Delete duplicates and files older than the retention threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
