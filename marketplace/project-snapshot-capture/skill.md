# Project Snapshot Capture

Capture the current project plan, assumptions, timeline, and success criteria as the baseline for the pre-mortem.

## Inputs

- `project-plan`: The current project plan with milestones and timeline
- `success-criteria`: What success looks like in specific, measurable terms

## Outputs

- `plan-snapshot`: The project plan frozen at this moment, including all stated assumptions
- `assumption-list`: Every assumption the plan depends on, extracted and listed explicitly

## Process

1. Write down the plan as it exists today: milestones, dates, dependencies, owners, and the definition of success.
2. Extract every assumption embedded in the plan. A plan that says 'launch by March' assumes the team is available, the technology works, approvals come through, and no competitor moves first. Make each assumption explicit.
3. For each assumption, rate how confident you are that it will hold (high, medium, low). Low-confidence assumptions are the first candidates for failure causes.
4. Identify any dependencies on external parties or events you do not control. These are the highest-risk elements because you cannot fix them by working harder.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
