# Feedback Categorizer Scorer

Categorize feedback by product area and theme, then score by frequency and business impact.

## Inputs

- `aggregated-feedback`: All feedback items in the central queue
- `product-areas`: Product areas for categorization

## Outputs

- `scored-feedback`: Feedback items categorized by area and theme, scored by frequency and impact
- `theme-ranking`: Themes ranked by combined frequency and business impact score

## Process

1. Classify each item by product area and theme (feature request, bug, usability, performance).
2. Count the frequency of each theme across all sources.
3. Score the business impact of each theme (revenue at risk, churn signal, expansion blocker).
4. Rank themes by the combined frequency and impact score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
