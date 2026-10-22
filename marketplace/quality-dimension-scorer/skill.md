# Quality Dimension Scorer

Score each critical data set across the five quality dimensions.

## Inputs

- `critical-data-sets`: Data sets that inform important decisions
- `quality-standards`: Minimum acceptable quality for each dimension

## Outputs

- `quality-scorecard`: Scores on completeness, accuracy, consistency, timeliness, and uniqueness per data set
- `quality-gaps`: Dimensions below minimum, ranked by impact on decision-making

## Process

1. Completeness: percentage of required fields populated. Sample 100+ records.
2. Accuracy: verify sample against source of truth. What percentage of values are correct?
3. Consistency: compare same data across different systems.
4. Timeliness: how old is the data? Does lag exceed decision cadence?
5. Uniqueness: what percentage are duplicates?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
