# Requirements Change Impact Analyzer

Analyze the impact of a proposed requirements change across the requirement hierarchy, design, verification, and schedule.

## Inputs

- `decomposed-requirements`: Full requirement hierarchy with traces
- `proposed-change`: The requirement change being evaluated: what changes and why

## Outputs

- `impact-assessment`: Affected requirements, design elements, test cases, and schedule items with severity and cost estimate
- `change-recommendation`: Accept, reject, or modify recommendation with rationale

## Process

1. Identify the directly changed requirement and trace downward: all child requirements that derive from it are potentially impacted. Also trace laterally: requirements that share an interface or a budget with the changed requirement may need adjustment.
2. For each impacted requirement, assess the design impact: does the current design still satisfy the modified requirement? If not, what design changes are needed? Estimate the effort for each design change.
3. For each impacted requirement, assess the verification impact: do existing test cases still verify the modified requirement? New test cases needed? Test infrastructure changes? Regression scope?
4. Aggregate cost, schedule, and risk impacts. Provide a recommendation: accept if the benefits exceed the impacts, reject if impacts are disproportionate, or modify the change to reduce impact while preserving the intent.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
