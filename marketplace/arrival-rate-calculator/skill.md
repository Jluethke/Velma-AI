# Arrival Rate Calculator

Measure the arrival rate: how fast items enter the queue. Count arrivals over a period long enough to capture variability (at least 2-4 weeks for most business processes).

## Inputs

- `queue-name`: The queue to analyze (support tickets, project requests, orders, tasks, any backlog)
- `measurement-period`: Time period over which to count arrivals

## Outputs

- `arrival-rate`: Average number of items arriving per unit time (per hour, per day)
- `arrival-variability`: Standard deviation of arrival rate, which determines how much buffer the system needs

## Process

1. Count every item that entered the queue during the measurement period. Use system timestamps, not memory.
2. Calculate the average arrival rate (total items divided by total time units).
3. Calculate the standard deviation. High variability means you need more slack in the system because burst arrivals will overwhelm a tightly tuned service rate.
4. Check for trends: is the arrival rate growing, stable, or declining? A growing rate means the problem will get worse.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
