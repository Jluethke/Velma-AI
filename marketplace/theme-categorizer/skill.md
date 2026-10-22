# Theme Categorizer

Categorize feedback by theme and sentiment.

## Inputs

- `raw-feedback`: Aggregated customer feedback
- `source-summary`: Source breakdown for weighting

## Outputs

- `themed-feedback`: Feedback categorized by theme with sentiment scores
- `theme-ranking`: Themes ranked by volume and impact

## Process

1. Identify recurring themes across all feedback.
2. Score sentiment for each piece of feedback.
3. Quantify each theme by volume and average sentiment.
4. Rank themes by combined volume and negative sentiment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
