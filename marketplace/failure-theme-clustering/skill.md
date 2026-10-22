# Failure Theme Clustering

Cluster the failure stories by theme. Stories that share a root cause go together. The themes that appear in multiple independent stories are your highest-probability failure modes, because independent convergence on the same risk is a strong signal.

## Inputs

- `failure-stories`: The independent failure narratives
- `story-count`: How many stories were generated

## Outputs

- `failure-themes`: Clustered themes with the number of stories that independently named each one
- `theme-frequency-ranking`: Themes ranked by how many independent stories converged on them

## Process

1. Read each story and extract the root cause (the thing that actually broke, not the symptom).
2. Group stories that share a root cause into themes. Name each theme in 3 to 5 words.
3. Count how many independent stories landed on each theme.
4. Rank themes by frequency. Themes named by 3+ independent stories are high-probability failure modes.
5. Flag any theme that appeared only once but would be catastrophic if it occurred.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
