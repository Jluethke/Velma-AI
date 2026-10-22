# Arrival Reduction Strategies

Reduce the arrival rate by preventing unnecessary items from entering the queue. This is the demand-side fix. It is often cheaper than adding capacity.

## Inputs

- `queue-name`: The queue being analyzed
- `utilization-percent`: Current utilization level

## Outputs

- `deflection-opportunities`: Ways to reduce arrivals without degrading the service (self-service, prevention, batching, triage)
- `projected-arrival-reduction`: Estimated percentage reduction in arrivals from each strategy

## Process

1. Categorize queue items by type. Identify which types could be prevented entirely (fix the upstream cause so the item never enters the queue).
2. Identify which types could be deflected to self-service (FAQ, knowledge base, automated response).
3. Identify which types could be batched (process together at a scheduled time instead of individually).
4. For each strategy, estimate the arrival reduction and recalculate utilization. Target utilization below 80%.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
