# Change Request Evaluator

When someone asks to add or change scope, evaluate it against the constraint triangle. Adding scope without adjusting time, cost, or quality is a lie.

## Inputs

- `in-scope-list`: The agreed scope
- `constraints`: The fixed constraints
- `change-request`: The requested change or addition to scope

## Outputs

- `impact-assessment`: The impact of the change on time, cost, and quality. At least one must change. If the requestor wants none to change, the change is denied.
- `trade-off-options`: The options: add the scope and extend the deadline, add the scope and increase the budget, add the scope and reduce quality elsewhere, or remove something else to make room

## Process

1. For each change request, estimate the impact on time (how many additional days), cost (how much additional budget), and quality (what gets less attention to make room).
2. Present the trade-off: 'We can add [change]. The impact is [X days / $Y / reduced quality on Z]. Which trade-off do you prefer?' The requestor must choose.
3. If the requestor wants the change without any trade-off, the answer is: 'That is not possible within the current constraints. Which constraint should we relax?'
4. Log every change request and its resolution: approved (with trade-off), deferred (to a future phase), or denied (does not justify the trade-off). This log is the scope management audit trail.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
