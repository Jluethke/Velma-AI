# Network Effect Health Monitoring

Monitor whether the network effect is real and strengthening over time, and set the rule for when to push growth harder. A network effect that is not strengthening is a cost center dressed up as a moat.

## Inputs

- `engagement-metric`: The metric linking engagement per user to total user count
- `cold-start-plan`: How to give early users value before the network exists

## Outputs

- `network-health-dashboard`: The ongoing view of network-effect health
- `scaling-decision-rule`: The rule for when to invest harder in growth

## Process

1. Track the engagement metric alongside user count to watch the effect strengthen or stall.
2. Watch the first segment from the cold start plan to confirm the effect holds as it widens.
3. Set the rule: push growth hard only once engagement per user clearly rises with scale.
4. Flag a stalling effect early, since scaling a weak network effect just raises cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
