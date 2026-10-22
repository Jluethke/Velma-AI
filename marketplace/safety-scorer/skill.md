# Safety Scorer

Score the results and identify failure patterns.

## Inputs

- `raw-results`: All test outputs
- `safety-taxonomy`: Categories and thresholds

## Outputs

- `safety-scores`: Scores by category and overall
- `failure-analysis`: Patterns and root causes of failures

## Process

1. Score each output against the category thresholds.
2. Calculate pass rates by category.
3. Identify failure patterns across categories.
4. Rank failures by severity and frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
