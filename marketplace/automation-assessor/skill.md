# Automation Assessor

For surviving tasks, assess which can be fully automated with zero ongoing human effort. Partial automation (human still involved) often costs more than the manual process due to context-switching.

## Inputs

- `surviving-tasks`: Tasks that survived the elimination screen

## Outputs

- `automation-candidates`: Tasks that can be fully automated, with the automation method and estimated setup cost
- `manual-tasks`: Tasks that cannot be fully automated

## Process

1. For each task, check: is it rule-based (no judgment calls)? Is the input structured? Is the output predictable? If all three, it can be automated.
2. For each automation candidate, identify the automation method (script, integration, scheduled job, template).
3. Estimate the setup cost in hours. Divide by the hours saved per cycle. If the payback period is under 10 cycles, automate.
4. Reject partial automation unless the human portion can be batched into a single review step.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
