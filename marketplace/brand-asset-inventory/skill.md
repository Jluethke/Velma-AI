# Brand Asset Inventory

Inventory all brand assets across the organization.

## Inputs

- `asset-sources`: List of locations where brand assets are stored (drives, tools, repositories)
- `brand-guidelines`: Current brand guidelines to identify what counts as an official asset

## Outputs

- `asset-catalog`: Complete catalog of brand assets with type, location, version, and status
- `asset-issues`: Outdated, duplicate, or unauthorized assets found during inventory

## Process

1. Search each source location for brand assets (logos, icons, photos, templates, fonts, color files).
2. Catalog each asset with its type, format, dimensions, version, and current location.
3. Flag assets that are outdated, duplicated, or not aligned with current brand guidelines.
4. Produce the asset catalog and issues list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
