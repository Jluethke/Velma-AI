# Storage Structure Auditor

Audit the current cloud storage structure, file naming patterns, and usage across folders.

## Inputs

- `storage-platform`: The cloud storage platform in use (Google Drive, Dropbox, OneDrive, S3, or multiple)
- `team-size`: Number of people using the storage and their roles

## Outputs

- `folder-inventory`: Current folder tree with file counts, sizes, and last-modified dates
- `naming-issues`: List of naming inconsistencies, duplicates, and orphaned files

## Process

1. Walk the top-level folder tree and record the depth, file count, and total size of each branch.
2. Flag naming inconsistencies: mixed casing, date formats, abbreviations, and special characters.
3. Identify duplicate files by name and size, orphaned files with no clear owner, and folders with no recent activity.
4. Summarize the findings into a folder inventory and a naming issues list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
