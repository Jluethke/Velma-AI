# Reading Recommendation Collector

Collect and organize book and article recommendations.

## Inputs

- `recommendation-sources`: Where recommendations come from (people, newsletters, lists)
- `reading-interests`: Topics and genres of interest

## Outputs

- `raw-reading-list`: All collected recommendations with source and topic
- `topic-clusters`: Recommendations grouped by topic

## Process

1. Gather all pending recommendations from every source.
2. Tag each with topic, format (book, article, paper), and source.
3. Group by topic cluster.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
