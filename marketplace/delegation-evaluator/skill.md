# Delegation Evaluator

For remaining manual tasks, evaluate delegation. The question is not 'can someone else do this?' but 'is my time on this task the highest-value use of my time?'

## Inputs

- `manual-tasks`: Tasks that cannot be eliminated or automated
- `total-hours-consumed`: Total time context

## Outputs

- `delegation-candidates`: Tasks to delegate, with the required skill level and estimated cost of delegation
- `owner-tasks`: Tasks that only you (or the current performer) should do

## Process

1. Calculate your effective hourly rate (total compensation divided by productive hours, or revenue per hour for a business).
2. For each task, estimate the hourly rate of someone who could do it competently. If that rate is lower than yours, it is a delegation candidate.
3. For each candidate, define the skill requirements, the handoff method, and the quality standard.
4. The remaining tasks (owner-tasks) are the ones where your specific judgment, relationships, or expertise are irreplaceable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
