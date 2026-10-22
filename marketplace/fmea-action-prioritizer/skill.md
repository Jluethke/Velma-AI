# Fmea Action Prioritizer

Prioritize and assign actions for high-risk failure modes.

## Inputs

- `risk-scores`: RPN scores
- `ranking`: Ranked failure modes

## Outputs

- `action-plan`: Recommended actions with owners and target dates
- `action-priorities`: Prioritized list focusing on high severity and high RPN items

## Process

1. Flag all failure modes with severity 9 or 10 regardless of RPN
2. Flag all failure modes with RPN above the threshold (typically 100 or 120)
3. Define recommended actions to reduce severity, occurrence, or detection
4. Assign action owners and target completion dates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
