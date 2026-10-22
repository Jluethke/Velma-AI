# Csat Alert Manager

Set thresholds and alerts for CSAT score drops so teams respond quickly.

## Inputs

- `csat-scorecard`: Current scores by touchpoint, segment, and team
- `score-trends`: Score trends and period comparisons

## Outputs

- `alert-config`: Alert thresholds and notification rules for score drops
- `triggered-alerts`: Alerts that fired with the score, threshold, and affected segment

## Process

1. Set the score threshold for each touchpoint (absolute floor and period-over-period drop).
2. Configure notifications to the touchpoint owner when a threshold is breached.
3. Log triggered alerts with the affected touchpoint, score, and segment.
4. Require an acknowledgment and action plan from the owner within the response SLA.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
