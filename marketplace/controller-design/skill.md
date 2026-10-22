# Controller Design

Design the controller: the mechanism that decides what corrective action to take based on the error signal. The controller translates 'you are 15% below target' into 'increase outbound calls by 20%' or 'reduce calorie intake by 300.' Without a controller, knowing you are off track does not help.

## Inputs

- `comparator-design`: How the error is calculated and classified
- `error-thresholds`: The thresholds for acceptable, concerning, and critical error

## Outputs

- `controller-design`: For each error level: the corrective action, the expected response time, and the escalation path if the correction does not work
- `correction-menu`: The menu of available corrective actions, ordered from least disruptive to most disruptive

## Process

1. List all available corrective actions, from smallest to largest. For weight: skip dessert, reduce portions, add a workout, consult a dietitian. For revenue: increase outreach, run a promotion, expand to a new channel, restructure pricing.
2. Map each error level to a corrective action. Acceptable error: no action (the system is self-correcting within noise). Concerning error: apply the smallest corrective action. Critical error: apply a larger action and increase monitoring frequency.
3. Define the escalation path: if the first corrective action does not reduce the error within one measurement cycle, escalate to the next action. If two cycles pass without improvement, escalate again.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
