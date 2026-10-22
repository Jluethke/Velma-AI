# Cms Content Inventory

Inventory all content in the current CMS: pages, posts, media, metadata, and taxonomy.

## Inputs

- `source-cms`: The current CMS platform and access details
- `migration-scope`: Which content types and sections to migrate

## Outputs

- `content-inventory`: Complete list of all content items with URLs, types, and metadata
- `media-inventory`: List of all media files (images, documents, videos) with paths

## Process

1. Export or crawl the full list of pages, posts, and custom content types.
2. Record each item's URL, title, status, author, dates, and taxonomy.
3. Inventory all media files and their associations to content.
4. Note any custom fields, shortcodes, or platform-specific features.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
