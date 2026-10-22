# Raw Data Explorer

Explore the raw dataset to understand distributions, types, and quality.

## Inputs

- `raw-dataset`: The raw dataset to explore
- `target-variable`: The prediction target or label

## Outputs

- `data-profile`: Statistical profile of each column
- `quality-issues`: List of data quality issues found

## Process

1. Compute summary statistics for every column (mean, median, std, min, max, nulls).
2. Visualize distributions and identify skewness or multimodality.
3. Check for class imbalance in the target variable.
4. Identify columns with high cardinality, constant values, or excessive nulls.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
