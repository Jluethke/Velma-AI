# Opsec Maintenance Checker

Monitor and maintain operational security throughout the exercise.

## Inputs

- `operation-log`: Timestamped action log
- `rules-of-engagement`: Constraints and communication protocols

## Outputs

- `opsec-assessment`: Assessment of whether the operation was detected at each stage
- `detection-timeline`: When the blue team detected activity, if at all

## Process

1. Track which actions generated alerts in the target environment
2. Monitor for blue team response actions (IP blocks, account locks, incident tickets)
3. Assess whether the operation remained covert through each phase
4. Document the detection timeline for comparison with blue team records

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
