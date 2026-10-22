# Early Warning Monitor Setup

Set up monitoring for the early warning indicators so the team can catch failure modes as they develop, not after they have materialized.

## Inputs

- `prevention-actions`: The prevention actions with early warning indicators
- `plan-modifications`: The modified project plan

## Outputs

- `monitoring-plan`: Which indicators to watch, how often to check, who checks, and what action to take if the indicator triggers
- `escalation-protocol`: What happens when an early warning triggers: who gets told, what decision gets made, and how fast

## Process

1. For each early warning indicator, define: what to measure, how often to measure it, who is responsible for measuring it, and the threshold that triggers action.
2. Keep the monitoring lightweight. If checking an indicator takes more than 5 minutes per week, it will be skipped. Automate where possible.
3. Define the escalation path: when an indicator triggers, who needs to know within 24 hours, and what decision authority do they have? A warning that triggers no action is theater.
4. Schedule a pre-mortem review at the project midpoint to reassess: which risks materialized (and were caught), which did not, and whether new risks have emerged that the original session did not anticipate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
