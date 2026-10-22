# Comparator Design

Design the comparator: the mechanism that calculates the error between the sensor reading and the target. The comparator's job is to produce a single number: how far off are you, and in which direction. Without a comparator, you have data but no information.

## Inputs

- `sensor-design`: How the current state is measured
- `target-value`: The desired state

## Outputs

- `comparator-design`: How the error is calculated: the formula, the frequency, and the output format (absolute error, percentage error, trend direction)
- `error-thresholds`: The thresholds that classify the error: acceptable (within noise), concerning (investigate), critical (act now)

## Process

1. Define the error formula: error = current value minus target value. Decide whether to use absolute error (how many units off) or relative error (what percentage off). Absolute is better when the target is small. Relative is better when comparing across different scales.
2. Set thresholds: acceptable error is within the normal noise range (1 standard deviation of historical variation). Concerning error exceeds noise but may be temporary (1.5-2 standard deviations). Critical error is clearly outside normal range (more than 2 standard deviations).
3. Define the comparator frequency: match it to the sensor frequency. Every time the sensor reads, the comparator calculates. The output is a single status: on track, concerning, or critical.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
