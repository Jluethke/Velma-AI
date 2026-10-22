# Option Scoring Independent

Score each option against each criterion independently. Score one criterion at a time across all options (not one option at a time across all criteria). This reduces the halo effect: the tendency to rate an option high on everything because you like it on one dimension.

## Inputs

- `weighted-criteria`: The criteria with weights
- `must-have-filters`: Non-negotiable filters to apply first
- `decision-description`: The decision and the options

## Outputs

- `score-matrix`: Each option scored on each criterion (1-5 scale), one criterion at a time
- `eliminated-options`: Options eliminated by must-have filters before scoring

## Process

1. First, apply the must-have filters. Eliminate any option that fails a non-negotiable requirement.
2. For the remaining options, score one criterion at a time. Rate all options on criterion 1 before moving to criterion 2.
3. Use a 1-to-5 scale: 1 = poor, 2 = below average, 3 = average, 4 = above average, 5 = excellent.
4. If you cannot distinguish between options on a criterion, give them the same score. Do not force a difference that does not exist.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
