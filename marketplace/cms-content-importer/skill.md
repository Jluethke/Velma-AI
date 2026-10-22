# Cms Content Importer

Import the content into the target CMS and verify integrity.

## Inputs

- `export-package`: Transformed content package
- `export-log`: Export record for cross-checking

## Outputs

- `import-report`: Summary of imported items with success and failure counts
- `imported-url-map`: Mapping of old URLs to new URLs

## Process

1. Import the content package into the target CMS.
2. Verify the item count matches the source inventory.
3. Check that media files, images, and links are intact.
4. Record the old-to-new URL mapping for redirects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
