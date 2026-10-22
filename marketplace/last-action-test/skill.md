# Last Action Test

For each metric, ask the last-action question: when was the last time someone took a specific action because this metric changed? Not discussed it, not noticed it, but actually did something different. This single question eliminates most dashboard metrics.

## Inputs

- `metric-census`: All metrics from the census
- `audience-description`: Who looks at these dashboards

## Outputs

- `action-linked-metrics`: Metrics where someone took action in the last 90 days because of the metric's value
- `no-action-metrics`: Metrics where no one can name a specific action taken because of the metric

## Process

1. For each metric, ask the dashboard audience: in the last 90 days, did you change what you were doing because of this number? If yes, document the action. If no, mark it as no-action.
2. Be strict. 'I looked at it' is not an action. 'I mentioned it in a meeting' is not an action. An action is: I changed a plan, allocated a resource, started or stopped something, or escalated an issue.
3. If the audience cannot remember whether they acted on a metric, that is a no. A metric that drives action is memorable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
