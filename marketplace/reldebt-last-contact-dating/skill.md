# Reldebt Last Contact Dating

Date your last real interaction with each person (a genuine exchange, not a passive like or a mass message) and rank by silence duration, so the extent of each relationship's decay becomes a concrete number instead of a vague sense of having been out of touch.

## Inputs

- `past-important-list`: The people who mattered within the lookback window
- `recall-confidence-notes`: How vividly each relationship is remembered

## Outputs

- `last-contact-dates`: The date of the last genuine two-way interaction with each person
- `silence-duration-ranking`: The list ranked by how long the silence has run, from most recently in touch to most decayed

## Process

1. For each person, find the last real interaction: a conversation, a genuine message exchange, a meeting. Do not count passive signals like seeing their post or a group broadcast. Those feel like contact but are not.
2. Where you cannot find an exact date, estimate to the season (spring two years ago). An approximate date is enough to rank, and chasing precision here wastes the audit's time.
3. Rank by silence duration. The ranking matters because recently dormant relationships are easy to restart while the longest-silent ones may not remember you well, which changes the reconnection approach.
4. Notice where silence duration and recall confidence disagree. A person you remember vividly but have not contacted in two years is a relationship you have been carrying as debt, meaning to reach out and never doing it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
