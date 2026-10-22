# Strategic Retreat Opportunity Cost Trigger

Define the opportunity-cost trigger: the point where the expected gain from continuing is less than what the same resources would earn elsewhere. Continuing past this point destroys value even if the commitment is not failing outright.

## Inputs

- `resource-ledger`: The resources tied up and their rough value
- `retreat-triggers`: The named conditions that would signal retreat

## Outputs

- `opportunity-cost-trigger`: The threshold where continuing costs more than it returns
- `alternative-use-estimate`: The best estimated return on the resources elsewhere

## Process

1. Estimate the expected gain from continuing the commitment as it stands.
2. Estimate the best return the same resources could earn in their next-best use.
3. Set the trigger at the point where continuing returns less than the alternative.
4. Record the alternative-use estimate so the comparison can be rechecked over time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
