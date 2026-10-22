# Alert Analytics Setup

Set up ongoing alert analytics to track noise levels over time.

## Inputs

- `tuning-changelog`: Log of all tuning changes
- `consolidated-alerts`: Merged alerts

## Outputs

- `analytics-dashboard`: Dashboard tracking alert volume, action rate, and noise score over time
- `alert-reduction-report`: Final report documenting the audit, changes, and ongoing metrics

## Process

1. Build a dashboard that tracks weekly alert volume, action rate, and noise score by team.
2. Set a recurring review (monthly) to check for new noise patterns.
3. Define the target noise level (e.g., action rate above 50% for all alert rules).
4. Compile the alert reduction report with before-and-after metrics and the analytics setup.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
