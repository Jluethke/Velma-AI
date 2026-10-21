# Recompromise Monitoring Setup

Set up monitoring for re-compromise indicators on recovered systems.

## Inputs

- `scan-results`: Vulnerability scan results
- `sweep-results`: Persistence sweep data including IOCs to watch for

## Outputs

- `monitoring-rules`: Detection rules deployed for re-compromise indicators
- `monitoring-schedule`: Schedule for enhanced monitoring duration

## Process

1. Deploy detection rules specific to the attack TTPs used in the incident
2. Set up enhanced logging on recovered systems for the monitoring period
3. Configure alerts for any indicators of compromise from the original attack
4. Define the enhanced monitoring duration and review schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
