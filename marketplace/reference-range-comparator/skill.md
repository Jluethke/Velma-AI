# Reference Range Comparator

Compare each value against the reference range.

## Inputs

- `parsed-results`: Structured lab values
- `report-metadata`: Lab and specimen details

## Outputs

- `flagged-values`: Values outside reference ranges with direction (high or low)
- `normal-values`: Values within reference ranges

## Process

1. Compare each result against age- and sex-adjusted reference ranges.
2. Flag values as high, low, or critical.
3. Note any results at the margin that may warrant attention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
