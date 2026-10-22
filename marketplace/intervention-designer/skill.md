# Intervention Designer

For each manager in the bottom quartile on leading indicators, design a specific intervention. The intervention depends on which indicator is low. Low 1:1 consistency: the manager needs time management coaching or a reduced scope. Low engagement: the manager needs feedback on their leadership behaviors. Low time-to-fill: the manager needs to invest in their team's reputation.

## Inputs

- `correlation-report`: Which leading indicators predict which lagging outcomes
- `predictive-model`: The strongest leading-to-lagging predictors

## Outputs

- `intervention-plans`: For each flagged manager: the specific intervention, who delivers it, the timeline, and the success metric
- `escalation-criteria`: At what point a manager's leading indicators are bad enough to warrant removal from the management role, not just coaching

## Process

1. For each flagged manager, identify which leading indicator is lowest. Design the intervention around that specific deficit.
2. Match the intervention to the problem: 1:1 consistency (coaching on time management, reducing scope), engagement (behavioral feedback, leadership development), time-to-fill (employer branding within the team, manager involvement in hiring).
3. Set a timeline: 90 days for behavioral changes, 6 months for measurable improvement in leading indicators.
4. Define the escalation: if leading indicators do not improve after two intervention cycles (12 months), the manager should be considered for a role change. Bad management has a compounding cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
