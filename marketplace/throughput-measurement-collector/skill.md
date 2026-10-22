# Throughput Measurement Collector

Measure the throughput (items per unit time) at each stage of the process. Throughput must be measured, not estimated.

## Inputs

- `stage-map`: The process stages to measure
- `queue-points`: Wait states between stages

## Outputs

- `stage-throughput-data`: Measured throughput for each stage in items per hour or per day
- `queue-depth-data`: Number of items waiting at each queue point, measured at the same time as throughput

## Process

1. For each stage, count the number of items completed in a defined time period. Use at least one full cycle (a day, a week) to avoid sampling error.
2. Measure queue depth at each wait point. Growing queues indicate the downstream stage cannot keep up.
3. Record the measurement period and any anomalies (holidays, outages, unusual volume).
4. If direct measurement is impossible, use timestamps on items entering and leaving each stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
