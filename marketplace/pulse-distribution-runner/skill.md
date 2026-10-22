# Pulse Distribution Runner

Distribute the pulse survey and track participation rates.

## Inputs

- `pulse-cadence`: Survey frequency and rotation plan
- `question-bank`: Questions for the current cycle

## Outputs

- `pulse-responses`: Collected responses for the current cycle
- `participation-metrics`: Response rate by team, department, and tenure band

## Process

1. Select the questions for this cycle based on the rotation schedule.
2. Distribute the survey to all eligible employees via the selected channel (email, Slack, HRIS).
3. Send one reminder to non-respondents at the midpoint of the response window.
4. Close the survey and report participation rates by team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
