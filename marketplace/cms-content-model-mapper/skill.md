# Cms Content Model Mapper

Map the source content model to the target CMS structure.

## Inputs

- `content-inventory`: Full inventory of source content
- `media-inventory`: All media files and their associations

## Outputs

- `content-mapping`: Field-by-field mapping from source to target CMS
- `migration-exceptions`: Items that cannot map directly and need manual handling

## Process

1. Map each content type in the source to its equivalent in the target.
2. Map fields, taxonomies, and custom metadata.
3. Identify items that have no direct equivalent and document the workaround.
4. Document any content that needs transformation (shortcodes, embeds).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
