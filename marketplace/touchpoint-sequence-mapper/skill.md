# Touchpoint Sequence Mapper

Map every touchpoint in the path to conversion.

## Inputs

- `outcome-definition`: The outcome to attribute
- `data-sources`: Available touchpoint data

## Outputs

- `touchpoint-sequences`: Ordered sequences of touchpoints per conversion with timestamps and channels
- `touchpoint-summary`: Frequency of each channel by position (first, middle, last)

## Process

1. Collect all touchpoint data: web visits, ads, emails, social, calls, meetings, referrals.
2. Build the sequence for each conversion: ordered by timestamp with channel and campaign identified.
3. Summarize patterns: which channels appear most at first position (awareness), middle (nurture), last (conversion)?
4. Note data gaps: untraceable touchpoints (word of mouth, direct visits) create blind spots.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
