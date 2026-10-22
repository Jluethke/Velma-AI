# Feature Candidate List

List all feature candidates from every source: customer requests, internal ideas, competitive gaps, and technical debt.

## Inputs

- `feature-sources`: All places feature ideas come from (support tickets, sales feedback, roadmap, competitor analysis, team ideas)
- `current-roadmap`: The existing roadmap

## Outputs

- `feature-list`: Every feature candidate in one list, deduplicated, with the source and a one-sentence description
- `feature-count`: Total number of candidates

## Process

1. Collect feature ideas from every source: support tickets (what customers ask for), sales team (what prospects need), competitor analysis (what competitors have), internal team (what engineers and designers see), and analytics (what the usage data suggests).
2. Deduplicate: the same feature requested by 5 customers and suggested by 2 engineers is one feature with 7 votes, not 7 features.
3. Write a one-sentence description for each feature. If you cannot describe it in one sentence, it is too vague to score.
4. Do not filter yet. The scoring method handles prioritization. Filtering before scoring introduces bias.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
