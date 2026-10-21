# Data Asset Inventorier

Inventory data assets across the organization and assign classifications.

## Inputs

- `classification-scheme`: Levels and criteria for classification
- `system-inventory`: Systems where data resides

## Outputs

- `classified-inventory`: Data assets with assigned classification levels
- `classification-statistics`: Distribution of data across levels

## Process

1. Scan systems for data repositories and data flows
2. Catalog each data asset with its type, location, and owner
3. Apply the classification criteria to assign a level
4. Record the classification rationale for each asset

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
