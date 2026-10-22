# Max Sustainable Throughput Measurer

Measure the maximum sustainable throughput of the system. Sustainable means it can maintain this rate indefinitely without degradation. Peak throughput (sprint pace) is not capacity; it borrows from the future.

## Inputs

- `system-description`: The system to plan capacity for (yourself, a team, a server, a factory line, a support queue)
- `throughput-unit`: What to measure (tasks per day, requests per second, units per hour)

## Outputs

- `max-sustainable-throughput`: The highest rate the system can sustain without quality degradation, burnout, or increasing error rates
- `degradation-indicators`: The signals that appear when the system is approaching or exceeding sustainable capacity

## Process

1. Measure throughput over a period that includes both normal and busy periods. The sustainable rate is the rate that held during busy periods without degradation.
2. Identify degradation indicators: increasing error rates, growing backlogs, longer cycle times, declining quality scores, staff overtime.
3. If degradation indicators are already present, the system is already over capacity. Sustainable throughput is below current load.
4. Do not use theoretical capacity (the number on the spec sheet). Use measured capacity under real conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
