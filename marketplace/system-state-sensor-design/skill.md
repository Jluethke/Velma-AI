# System State Sensor Design

Design the sensor: the mechanism that measures the current state of the thing you want to control. The sensor must measure the right thing, at the right frequency, with enough accuracy to detect the changes you care about. A bathroom scale is a sensor. A quarterly business review is a sensor. A daily standup is a sensor.

## Inputs

- `controlled-variable`: The thing you want to keep on target (weight, revenue, code quality, response time, etc.)
- `target-value`: The desired state of the controlled variable

## Outputs

- `sensor-design`: What measures the current state, how often, and with what precision
- `measurement-lag`: The delay between reality changing and the sensor reflecting the change

## Process

1. Identify what directly measures the controlled variable. Not a proxy, not a related metric, but the actual value. Revenue is measured by the accounting system. Weight is measured by the scale. Response time is measured by the monitoring system.
2. Set the measurement frequency to at least 4x the action frequency. If you can adjust weekly, measure at least twice a week. If you can adjust daily, measure daily.
3. Estimate the measurement lag: how long between reality changing and the sensor showing the change. Accounting revenue has a 30-day lag (invoiced vs. collected). The bathroom scale has a 1-3 day lag (water weight masks fat loss). The monitoring system has seconds of lag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
