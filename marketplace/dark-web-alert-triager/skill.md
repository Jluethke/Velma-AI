# Dark Web Alert Triager

Triage and validate incoming dark web alerts to separate genuine threats from noise.

## Inputs

- `alerting-rules`: Active alert rules generating hits
- `source-configuration`: Sources producing the alerts

## Outputs

- `validated-alerts`: Confirmed genuine findings with context and severity
- `false-positive-log`: Dismissed alerts with reasons for tuning

## Process

1. Review each alert for relevance (does it actually reference the organization)
2. Validate credential leaks by checking format and recency
3. Assess threat actor credibility by forum reputation and post history
4. Classify each alert by severity (critical, high, medium, informational)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
