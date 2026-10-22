# Setup And Holding Cost Measurer

Measure the two costs that determine optimal batch size. Setup cost: the fixed cost incurred each time you start a batch (switching contexts, configuring tools, gathering materials). Holding cost: the cost of each item waiting in a batch before it is processed or delivered.

## Inputs

- `process-name`: The process to optimize for batch size or flow
- `current-batch-size`: How many items are currently batched together (1 = flow, more = batch)

## Outputs

- `setup-cost`: Cost (in time or money) incurred each time a batch starts, regardless of batch size
- `holding-cost-per-item`: Cost of one item waiting per unit time (delay cost, inventory cost, opportunity cost)

## Process

1. Measure setup cost: time how long the setup or context switch takes each time a batch starts. Convert to dollars using the performer's hourly rate.
2. Measure holding cost per item: for each item waiting in a batch, calculate the cost of delay (customer waiting, inventory carrying cost, tied-up resources).
3. If setup cost is near zero (no meaningful context switch), the process should flow. Stop here and recommend flow.
4. If holding cost is near zero (items do not lose value by waiting), large batches are fine. But verify this assumption: customers waiting is a holding cost that people often ignore.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
