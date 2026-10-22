# Cross Train Vs Hire Decider

Decide, for each single point and gap, whether to cross-train, hire, or contract. Single points are usually solved by cross-training; gaps need a hire, a trained-up person, or a contractor, depending on how specialized the skill is.

## Inputs

- `gap-list`: The zero-coverage gaps
- `gap-impact-ranking`: Their impact ranking

## Outputs

- `remediation-decisions`: For each single point and gap, the chosen path: cross-train, hire, train, or contract
- `decision-rationale`: The reason behind each decision

## Process

1. For each single point of failure, check whether someone with adjacent skills can be cross-trained; if so, cross-train is the default.
2. For each gap, decide: train an existing person if the skill is learnable in reasonable time, hire if it is core and ongoing, contract if it is specialized and intermittent.
3. Avoid cross-training a person who is already a single point on another skill, since that just moves the risk.
4. Record the decision and the reason for each single point and gap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
