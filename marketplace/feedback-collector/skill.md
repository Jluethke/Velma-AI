# Feedback Collector

Collect customer feedback from all sources.

## Inputs

- `feedback-sources`: Sources to collect from (tickets, surveys, reviews, social media)
- `time-range`: Period to analyze

## Outputs

- `raw-feedback`: Aggregated feedback from all sources
- `source-summary`: Volume and type breakdown by source

## Process

1. Pull feedback from each configured source.
2. Normalize the format across sources.
3. Deduplicate entries from the same customer.
4. Produce the source volume summary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
