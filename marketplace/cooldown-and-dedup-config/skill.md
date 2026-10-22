# Cooldown And Dedup Config

Configure the cool-down period to prevent alert storms. When an anomaly persists, the system should fire once and suppress duplicates until the anomaly resolves or a new, different anomaly occurs. Without cool-down, a single outage generates an alert every measurement interval.

## Inputs

- `sensitivity-level`: The alert threshold in standard deviations
- `threshold-parameters`: The measurement frequency and threshold configuration

## Outputs

- `cooldown-config`: How long to suppress repeat alerts after the first firing (e.g., 1 hour, 1 day), and the conditions that reset the cool-down
- `dedup-rules`: How to group related anomalies into a single incident rather than separate alerts

## Process

1. Set the cool-down period to the expected resolution time for a typical anomaly. If most anomalies resolve within 1 hour, set cool-down to 1 hour. If they take a day, set it to 1 day.
2. Define the reset condition: the cool-down resets when the metric returns to the normal range for at least 2 consecutive measurements. This prevents premature reset from a brief dip back to normal.
3. Define deduplication: if two metrics anomaly-fire within the same cool-down window and share a likely root cause (same system, same customer, same time), group them into one incident.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
