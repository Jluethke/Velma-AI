# Win Loss Pattern Analyzer

Categorize reasons and identify patterns across won and lost deals.

## Inputs

- `feedback-responses`: Buyer feedback data
- `deal-sample`: Deal metadata and outcomes

## Outputs

- `win-loss-patterns`: Categorized reasons with frequency counts
- `segment-differences`: How patterns differ by deal size, segment, or competitor

## Process

1. Categorize each response by primary reason (price, product, relationship, timing, competitor).
2. Count the frequency of each reason for wins and losses separately.
3. Cross-tabulate by segment, deal size, and competitor.
4. Identify statistically significant patterns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
