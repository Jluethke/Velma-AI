# Anomaly Response Protocol

Define what happens when an anomaly fires. The detection system identifies the anomaly. The response protocol determines what to do about it. Without a response protocol, anomaly detection is a notification, not a system.

## Inputs

- `cooldown-config`: How alerts are suppressed and grouped
- `metric-to-monitor`: The metric, for context on who should respond

## Outputs

- `response-protocol`: Who is notified, through what channel, and what diagnostic steps they take first
- `anomaly-detection-system`: The complete system: baseline, thresholds, sensitivity, cool-down, and response protocol, ready to operate

## Process

1. Define the notification: who receives the alert, through what channel (email, SMS, Slack, pager), and the message format (metric name, current value, baseline value, deviation magnitude).
2. Define the first diagnostic step: is this a real anomaly or a data quality issue? Check the data source for collection errors, delayed data, or double-counting before investigating the metric itself.
3. Define the escalation: if the anomaly persists after the cool-down period and the first diagnostic step did not explain it, who gets the escalation, and what additional resources are available?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
