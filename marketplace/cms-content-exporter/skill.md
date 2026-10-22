# Cms Content Exporter

Export and transform content from the source CMS into the target format.

## Inputs

- `content-mapping`: Field mapping from source to target
- `migration-exceptions`: Items needing special handling

## Outputs

- `export-package`: Transformed content ready for import into the target CMS
- `export-log`: Record of what was exported and any issues encountered

## Process

1. Export all content from the source CMS.
2. Transform the content according to the mapping document.
3. Handle exceptions (shortcode conversion, embed replacement).
4. Package the content for import into the target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
