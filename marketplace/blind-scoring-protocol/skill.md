# Blind Scoring Protocol

Score the work samples with candidate identity removed. Strip names, email addresses, and any identifying metadata from submissions before scoring. Assign each submission a random ID. If multiple scorers are available, have each score independently before comparing.

## Inputs

- `scoring-rubric`: The rubric with dimensions, scales, and weights
- `scorer-instructions`: How to apply the rubric

## Outputs

- `blinding-protocol`: Step-by-step process for stripping identity from submissions and assigning random IDs
- `inter-rater-process`: How to handle disagreements between multiple scorers, including the threshold for discussion

## Process

1. Before scoring begins, a coordinator (not a scorer) strips all identifying information from each submission and assigns a random 4-digit ID.
2. Each scorer receives the anonymized submissions and scores them independently using the rubric. No discussion until all scores are submitted.
3. After independent scoring, compare scores. If two scorers differ by more than 1 point on any dimension, they discuss that dimension and re-score. The goal is calibration, not consensus.
4. Record the final scores by random ID. Reveal identities only after all scoring is complete.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
