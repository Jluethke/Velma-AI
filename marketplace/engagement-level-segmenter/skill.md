# Engagement Level Segmenter

Segment subscribers by engagement level and track movement between segments.

## Inputs

- `welcome-sequence`: The welcome sequence design
- `welcome-goals`: Goals and metrics for engagement

## Outputs

- `engagement-segments`: Defined engagement segments with thresholds (active, at-risk, dormant)
- `segment-movement-report`: Report showing how subscribers move between engagement levels over time

## Process

1. Define the engagement scoring criteria (opens, clicks, replies, purchases weighted by recency).
2. Set the thresholds for each segment (active, at-risk, dormant).
3. Calculate the current distribution across segments.
4. Track the movement between segments month over month.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
