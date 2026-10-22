# Maintenance Cost Estimate

Estimate the recurring maintenance the automation will demand, since automation is not free after it ships. Brittle integrations and changing inputs turn a one-time build into an ongoing cost that can erase the saving.

## Inputs

- `build-hours`: One-time build estimate
- `build-assumptions`: Build assumptions

## Outputs

- `annual-maintenance-hours`: Estimated yearly hours to keep the automation working
- `maintenance-assumptions`: What drives the maintenance estimate

## Process

1. Estimate the yearly hours to fix breakage, handle input changes, and keep dependencies current.
2. Weigh how brittle the automation is against how often its inputs or environment change.
3. Add the cost of monitoring the automation so silent failures do not go unnoticed.
4. Record what drives the estimate so it can be revised as the automation ages.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
