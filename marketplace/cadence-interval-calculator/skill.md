# Cadence Interval Calculator

Calculate the optimal follow-up interval for each velocity segment, based on the principle that follow-up timing should match the natural rhythm of the relationship.

## Inputs

- `velocity-scores`: Per-contact velocity scores
- `velocity-segments`: Contacts grouped by velocity tier

## Outputs

- `segment-cadences`: The recommended follow-up interval for each velocity segment with the reasoning
- `individual-overrides`: Contacts whose optimal interval differs from their segment default, with the reason

## Process

1. Set the base interval as 1.5 times the median gap between interactions in that segment. If high-velocity contacts interact every 10 days on average, the follow-up interval is 15 days. This ensures you follow up before the natural rhythm breaks but not so often that you are pushing faster than the relationship wants to move.
2. Adjust for relationship value. Multiply the base interval by a value factor: high-value contacts (top 20% by whatever your value metric is) get 0.8x the interval (more frequent). Low-value contacts get 1.2x (less frequent). The adjustment is small because value should not overwhelm rhythm.
3. Identify individual overrides. Some contacts have strong patterns (always responds on Mondays, goes dark in December, only engages around quarterly reviews). Set contact-level overrides for these. The pattern is more useful than the math.
4. Define the diminishing-returns rule: if three consecutive follow-ups get no response, double the interval. If three more get no response, move the contact to a re-engagement sequence instead of continuing the cadence. Persistence past the diminishing-returns threshold is noise, not diligence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
