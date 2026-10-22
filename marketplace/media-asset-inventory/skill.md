# Media Asset Inventory

Inventory all media assets across storage locations.

## Inputs

- `storage-locations`: Where media files currently live (local drives, cloud storage, external drives, SaaS platforms)
- `asset-types`: Types of media to manage (images, videos, audio, PDFs, presentations)

## Outputs

- `asset-catalog`: List of all media files with type, size, location, and creation date
- `duplicate-report`: Files that appear in multiple locations or under different names

## Process

1. Scan each storage location for files matching the specified media types.
2. Record each file's name, type, size, creation date, and current location.
3. Identify duplicates by file hash or name-plus-size matching.
4. Produce the asset catalog and duplicate report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
