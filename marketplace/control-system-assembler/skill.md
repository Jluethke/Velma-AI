# Control System Assembler

Assemble the complete control system: the surviving metrics, their thresholds, their response actions, and the review cadence. This is the artifact that replaces the old dashboard. It is not a display. It is an operating manual.

## Inputs

- `linked-metrics`: Metrics that already had actions
- `response-actions`: Newly designed actions for previously unlinked metrics
- `escalation-rules`: What happens when actions fail or deadlines pass

## Outputs

- `control-system-document`: The complete metric-action control system: every active metric, its threshold, its response, its owner, and its escalation path
- `retired-metrics-log`: Metrics retired in this process, with the reason, for reference if someone asks why they disappeared

## Process

1. Combine all linked metrics (old and new) into a single document. For each: metric name, source, cadence, thresholds, yellow action, red action, owner, escalation.
2. Set the review cadence: how often to check whether the control system itself is working. Monthly is typical. In the review, check: did any metric hit yellow or red? Was the action taken? Did it work?
3. Delete the retired metrics from the dashboards. If someone complains, show them the retired-metrics log and ask when they last acted on the metric.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
