# Lineage Tracker Setup

Set up data lineage visualization across the catalog.

## Inputs

- `populated-catalog`: Catalog with asset metadata
- `asset-inventory`: Inventory including ETL and transformation jobs

## Outputs

- `lineage-graph`: Data lineage graph (table and column level)
- `impact-analysis`: Ability to trace downstream impact of changes

## Process

1. Extract lineage from ETL tools, SQL parsing, and pipeline DAGs.
2. Build the lineage graph at table and column granularity.
3. Implement upstream and downstream traversal for impact analysis.
4. Visualize lineage paths in the catalog interface.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
