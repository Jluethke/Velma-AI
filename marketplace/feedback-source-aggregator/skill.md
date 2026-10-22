# Feedback Source Aggregator

Collect product feedback from multiple sources into a single intake queue.

## Inputs

- `feedback-sources`: The channels to collect from (support tickets, surveys, sales calls, app reviews, social)
- `product-areas`: The product areas or modules for categorization

## Outputs

- `aggregated-feedback`: All feedback items in a single queue with source, date, and customer info
- `source-volume-breakdown`: Feedback volume by source channel

## Process

1. Configure integrations to pull feedback from each source into the central queue.
2. Normalize the data format (feedback text, source, date, customer ID, product area if known).
3. Deduplicate items from the same customer about the same topic.
4. Tag each item with its source channel for later analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
