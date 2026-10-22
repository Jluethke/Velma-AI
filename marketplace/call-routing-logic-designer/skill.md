# Call Routing Logic Designer

Design the call routing logic including skills-based routing and queue priority.

## Inputs

- `service-level-targets`: Service level targets
- `staffing-model`: Staffing model by hour

## Outputs

- `routing-logic`: Call routing rules: skills-based assignment, queue priority, overflow rules
- `queue-config`: Queue definitions with priority levels and overflow thresholds

## Process

1. Define agent skill groups (billing, technical, sales, general).
2. Set the routing priority: match caller need to agent skill, then least-idle agent.
3. Design the overflow rules for when a queue exceeds its wait time threshold.
4. Configure VIP or priority routing for high-value customers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
