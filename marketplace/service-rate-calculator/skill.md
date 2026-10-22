# Service Rate Calculator

Measure the service rate: how fast items are processed and leave the queue. Use the same time period as the arrival rate measurement.

## Inputs

- `queue-name`: The queue being analyzed
- `measurement-period`: Same period used for arrival rate

## Outputs

- `service-rate`: Average number of items processed per unit time
- `service-variability`: Standard deviation of service rate, reflecting how inconsistent processing speed is

## Process

1. Count every item that was completed and left the queue during the measurement period.
2. Calculate the average service rate. This is the system's actual capacity, not its theoretical capacity.
3. Calculate the standard deviation. High variability means some items take much longer than others, which disrupts the queue.
4. If the service rate is lower than the arrival rate, the queue is growing and will continue growing until one of the rates changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
