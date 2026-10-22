# Pivot Dimension Configurator

Configure the pivot dimensions: rows, columns, values, and filters.

## Inputs

- `question-definition`: The precise analysis question
- `selected-dataset`: Dataset with relevant columns

## Outputs

- `pivot-configuration`: Row fields, column fields, value fields with aggregation functions, and filter conditions
- `aggregation-methods`: Aggregation function for each value field (sum, count, average, min, max, median)

## Process

1. Choose the row dimension (the primary grouping, e.g., product, region, month).
2. Choose the column dimension if a cross-tabulation is needed (e.g., month across columns).
3. Select the value fields and their aggregation functions (sum revenue, count orders, average rating).
4. Apply filters to scope the analysis (date range, category, status).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
