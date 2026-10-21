# Deleted Content Recoverer

Recover deleted content from the device including messages, photos, and files.

## Inputs

- `extracted-data`: The device data extraction including unallocated space
- `app-analysis`: Application analysis identifying potential deleted items

## Outputs

- `recovered-content`: Recovered deleted messages, photos, files, and app data
- `recovery-metadata`: Metadata about recovered items including deletion timestamps

## Process

1. Search SQLite WAL and journal files for deleted records
2. Carve unallocated space for known file signatures
3. Recover deleted photos from thumbnail caches
4. Document each recovered item with its source and confidence

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
