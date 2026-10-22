# Cross Training Planner

For each single point of failure, plan the cross-training. The goal is to move at least one additional person from learning to competent on each vulnerable skill. The person doing the cross-training should be the current expert, and the timeline should be realistic (most skills take 2-8 weeks of deliberate practice, not a one-hour knowledge transfer).

## Inputs

- `single-points-of-failure`: Skills with only one competent person, ranked by impact
- `risk-score`: Overall team risk level

## Outputs

- `cross-training-plan`: For each single point of failure: who will learn the skill, who will teach it, what the training looks like, and the target date for reaching competent level
- `training-priority-sequence`: The order in which to address the single points, starting with the highest-impact vulnerability

## Process

1. For each single point of failure, identify the best candidate to cross-train. Choose someone who: already has adjacent skills (reduces learning time), is not themselves a single point on another skill (do not overload), and is willing.
2. Define what competent looks like for this specific skill: what tasks must the person be able to handle independently?
3. Design the training: pair with the expert for X weeks, shadow specific tasks, then handle those tasks independently with the expert available for questions, then handle them fully independently.
4. Set a realistic timeline. A skill used daily can be learned in 2-4 weeks. A skill used weekly takes 4-8 weeks. A skill used monthly takes 2-3 months.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
