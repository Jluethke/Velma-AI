# Loss Inventory Builder

Build an inventory of recent losses: deals that stalled, customers who chose a competitor, attempts that failed, opportunities that went nowhere.

## Inputs

- `pipeline-data`: Sales pipeline, project history, or personal attempt log covering at least the last 6 months
- `loss-definition`: What counts as a loss (closed-lost deal, ghosted prospect, rejected proposal, abandoned project)

## Outputs

- `loss-inventory`: Structured list of losses with date, prospect or opportunity name, stage at which it stalled, and stated reason for loss
- `loss-volume-summary`: Count and percentage of losses by stage and by stated reason

## Process

1. Pull every closed-lost or abandoned opportunity from the last 6 months. Include deals that went silent (no explicit no, just disappeared).
2. For each loss, record: when it entered the pipeline, when it stalled, what stage it reached, and the stated reason (if one was given).
3. Categorize: competitor chosen, no decision made, budget cut, timing wrong, went silent, or explicit objection.
4. Calculate the loss rate by stage: what percentage of opportunities die at each point in the process?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
