# Pivot Calculation Runner

Execute the pivot calculation and produce the result table.

## Inputs

- `pivot-configuration`: Rows, columns, values, filters, and aggregations
- `selected-dataset`: The source dataset

## Outputs

- `pivot-table`: The computed pivot table with row totals, column totals, and grand total
- `derived-metrics`: Calculated metrics added to the pivot (percentage of total, rank, cumulative sum)

## Process

1. Apply filters to the dataset.
2. Group by the row and column dimensions, computing the aggregation for each cell.
3. Add row totals, column totals, and grand total.
4. Calculate derived metrics: percentage of total, rank, cumulative sum as needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
