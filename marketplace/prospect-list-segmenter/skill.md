# Prospect List Segmenter

Segment the prospect list for personalized outreach.

## Inputs

- `donor-history`: Past giving data
- `fund-target`: Dollar goal by segment

## Outputs

- `segmented-lists`: Contact lists by segment
- `ask-amounts`: Suggested ask amount per donor

## Process

1. Segment by giving level and recency
2. Calculate a suggested ask amount for each donor (based on last gift and capacity)
3. Flag lapsed donors for re-engagement messaging
4. Identify acquisition prospects from non-donor contacts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
