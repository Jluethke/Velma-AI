# Data Asset Inventory

Inventory all data assets across the organization.

## Inputs

- `data-systems`: List of data systems to catalog
- `catalog-scope`: Scope of the catalog effort

## Outputs

- `asset-inventory`: Complete inventory of data assets
- `system-metadata`: Technical metadata from each system

## Process

1. Connect to each data system and extract schema metadata.
2. Catalog databases, tables, columns, views, and APIs.
3. Record data types, constraints, and relationships.
4. Identify undocumented or shadow IT data stores.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
