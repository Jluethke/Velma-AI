# Metadata Populator

Populate metadata for each data asset.

## Inputs

- `metadata-schema`: The metadata schema to populate
- `system-metadata`: Technical metadata already extracted

## Outputs

- `populated-catalog`: Catalog with metadata populated
- `metadata-gaps`: Assets with incomplete metadata

## Process

1. Auto-populate technical metadata from system connections.
2. Collect business metadata from data owners through intake forms.
3. Apply classification labels using automated rules and manual review.
4. Identify and track gaps in metadata coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
