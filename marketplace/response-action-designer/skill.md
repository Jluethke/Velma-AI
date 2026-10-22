# Response Action Designer

Design the specific action triggered at each threshold. The action must be concrete, assignable, and completable within the measurement cadence. 'Look into it' is not an action. 'Run the customer churn diagnostic playbook and report findings by Friday' is.

## Inputs

- `calibrated-thresholds`: The metrics with their green/yellow/red boundaries
- `scope-boundary`: Who is available to take action, and what resources they have

## Outputs

- `response-actions`: For each metric at each threshold level: the specific action, the owner, and the completion deadline relative to the trigger
- `escalation-rules`: What happens if the action is not completed by the deadline, or if the metric does not recover after the action

## Process

1. For each yellow threshold: design a diagnostic action. The goal is to determine whether the movement is noise or signal. Example: pull the segment-level data and identify which segment moved.
2. For each red threshold: design a corrective action. The goal is to change an input that will move the metric back. Example: increase outbound call volume by 20% this week.
3. For each action, name the owner (a person, not a team) and the deadline (relative to the trigger, not a calendar date). 'Within 48 hours of the trigger' is a deadline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
