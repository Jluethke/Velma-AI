# Triage Record Writer

Produce the triage decision record documenting the alert, analysis, and disposition.

## Inputs

- `escalation-decision`: Decision to escalate, contain, or close
- `notification-list`: Teams and individuals notified

## Outputs

- `triage-record`: Complete triage decision record with timeline, evidence, and disposition
- `metrics-data`: Triage timing and outcome data for SOC metrics

## Process

1. Compile the full timeline from alert receipt through disposition
2. Document the evidence chain: what was checked, what was found, what was concluded
3. Record the disposition (escalated, closed as false positive, closed as handled) with rationale
4. Calculate triage time for SOC performance metrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
