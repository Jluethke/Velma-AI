# Cleaning Rule Definer

Define the cleaning rules for each category of issue found in profiling.

## Inputs

- `profiling-report`: Per-column statistics and quality metrics
- `issue-inventory`: Categorized list of data quality issues

## Outputs

- `cleaning-rules`: Ordered list of cleaning operations with their logic (standardize, deduplicate, fill, flag, correct)
- `priority-ranking`: Issues ranked by impact on downstream use

## Process

1. For format inconsistencies, define the standard format and the transformation to apply.
2. For duplicates, define the matching criteria and the merge or keep strategy (keep newest, merge fields).
3. For nulls, decide per column: fill with a default, fill from another source, flag for review, or drop the row.
4. For outliers, decide: cap at a threshold, flag for review, or leave as-is if legitimate.
5. Rank the rules by their impact on data usability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
