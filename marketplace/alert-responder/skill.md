# Alert Responder

Define what happens when an alert fires: verify, investigate, classify, act or dismiss.

## Inputs

- `alert-thresholds`: The calibrated thresholds
- `metric-description`: The metric context

## Outputs

- `response-protocol`: Step-by-step: verify data, investigate cause, classify as real or false, take action or dismiss
- `anomaly-log-template`: Template for logging each alert with classification and action taken

## Process

1. Step 1: Verify the data. Is the metric value correct or is there a data collection error?
2. Step 2: Investigate the cause. Check for known events: deployments, campaigns, holidays, competitor actions.
3. Step 3: Classify. Real anomaly or false alarm? Update the log.
4. Step 4: Act (fix the problem or capitalize on the opportunity) or dismiss (note for threshold recalibration).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
