# Scoring Signal Mapper

Assign point values to demographic and behavioral scoring signals.

## Inputs

- `icp-attributes`: ICP attributes and their importance
- `behavioral-events`: List of trackable prospect actions

## Outputs

- `scoring-matrix`: Points assigned to each signal
- `decay-rules`: Time-based score decay for stale signals

## Process

1. Map each ICP attribute to a point value based on its correlation rank.
2. Map each behavioral event (page visit, download, demo request) to points.
3. Define negative scoring for disqualifying signals.
4. Set decay rules for behavioral scores older than a threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
