# Noise Elimination Pass

Eliminate sources below the 30 percent signal threshold. Unsubscribe, unfollow, mute, or leave. The goal is not to be less informed but to be more focused on information that produces results.

## Inputs

- `source-signal-scores`: Scored sources with signal ratios
- `noise-sources-identified`: Sources below the 30 percent signal threshold

## Outputs

- `eliminated-sources`: List of sources eliminated with the method used (unsubscribe, unfollow, mute, leave channel)
- `retained-source-list`: Curated list of retained sources with their signal ratios and time budgets

## Process

1. For each source below 30 percent signal: unsubscribe, unfollow, mute, or leave. Do it now, not later. Every day of delay is more noise consumed.
2. For sources between 30 and 50 percent signal: consider whether a filtered version exists. Example: instead of following a person on social media (30 percent signal), subscribe to their long-form blog (70 percent signal).
3. For sources you are reluctant to cut: schedule a 30-day trial without them. If you do not miss the information after 30 days, the source was noise disguised as necessity.
4. After elimination, count the total number of remaining sources. If it is more than 15, you are still consuming too broadly. Narrow further.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
