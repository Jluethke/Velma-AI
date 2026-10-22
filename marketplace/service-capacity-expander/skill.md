# Service Capacity Expander

Increase the service rate by adding capacity, reducing processing time, or reducing variability. This is the supply-side fix.

## Inputs

- `service-rate`: Current service rate
- `service-variability`: Current service variability
- `utilization-percent`: Current utilization

## Outputs

- `capacity-expansion-options`: Ways to increase service rate with cost and expected throughput gain
- `target-utilization-plan`: The combination of arrival reduction and capacity expansion that brings utilization below 80%

## Process

1. Identify options to increase throughput: more servers/agents, faster processing (better tools, simpler steps), parallel processing.
2. Identify options to reduce service variability: standardize the process, pre-sort items by complexity, separate fast-track and slow-track queues.
3. For each option, estimate the cost and the new service rate. Recalculate utilization.
4. Select the combination of arrival reduction and capacity expansion that brings utilization below 80% at the lowest total cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
