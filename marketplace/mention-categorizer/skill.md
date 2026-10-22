# Mention Categorizer

Categorize incoming mentions by theme and sentiment.

## Inputs

- `channel-configuration`: The configured monitoring channels
- `boolean-queries`: The search queries in use

## Outputs

- `mention-categories`: Taxonomy of mention themes (product feedback, complaints, praise, feature requests, competitor mentions)
- `sentiment-baseline`: Baseline sentiment distribution to measure changes against

## Process

1. Define the mention categories (product feedback, complaint, praise, feature request, competitor comparison, general).
2. Classify a sample of recent mentions to establish the baseline distribution.
3. Calculate the baseline sentiment split (positive, neutral, negative).
4. Document the categorization rules for consistent tagging.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
