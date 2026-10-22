# Utilization And Wait Time Modeler

Calculate utilization (arrival rate divided by service rate). Model the relationship between utilization and wait time. This is the core insight of queuing theory: wait time is not linear with utilization. It is exponential.

## Inputs

- `arrival-rate`: Measured arrival rate
- `service-rate`: Measured service rate
- `arrival-variability`: Variability of arrivals
- `service-variability`: Variability of service

## Outputs

- `utilization-percent`: Current utilization as a percentage (arrival rate / service rate * 100)
- `expected-wait-time`: Expected time an item waits in the queue before processing begins, calculated from the queuing formula

## Process

1. Divide arrival rate by service rate. This is utilization. At 50%, the system has plenty of slack. At 80%, wait times are roughly 4x what they were at 50%. At 90%, wait times are roughly 9x. At 95%, the queue is effectively broken.
2. Apply the Kingman formula for approximate wait time: W = (utilization / (1 - utilization)) * (variability factor) * (average service time). The variability factor accounts for both arrival and service variability.
3. If utilization is above 80% and variability is high, the system will frequently experience long backlogs even if the average looks acceptable.
4. Present the utilization number and wait time. This is the diagnosis. The treatment is in the next steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
