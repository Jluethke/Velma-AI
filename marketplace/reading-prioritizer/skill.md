# Reading Prioritizer

Prioritize the reading list by relevance and urgency.

## Inputs

- `raw-reading-list`: All collected recommendations
- `reading-interests`: Current interests and goals

## Outputs

- `prioritized-list`: Reading list sorted by priority
- `next-reads`: The next 3-5 items to read

## Process

1. Score each item by relevance to current goals (high, medium, low).
2. Score by time sensitivity (some items lose relevance).
3. Sort by combined score and select the next 3-5.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
