# Asset Upload And Tagger

Upload and tag existing assets according to the metadata schema.

## Inputs

- `asset-catalog`: Inventory of files to upload
- `metadata-schema`: Fields and controlled vocabularies

## Outputs

- `tagged-asset-count`: Number of assets uploaded and tagged
- `tagging-exceptions`: Assets that could not be tagged automatically and need manual review

## Process

1. Deduplicate the asset catalog, keeping the highest-quality version of each file.
2. Batch-upload the deduplicated files to the asset management platform.
3. Auto-tag where possible (extract EXIF data, file name patterns, folder context).
4. Flag assets that lack enough information for manual tagging.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
