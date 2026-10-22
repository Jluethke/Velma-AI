# Requirements Change Impact Analysis

Assess the ripple effects of a proposed requirement change across the system hierarchy, budgets, interfaces, and verification plan.

## Inputs

- `traceability-matrix`: Current bidirectional traceability
- `orphan-report`: Known gaps and scope issues
- `verification-plan-skeleton`: Verification assignments

## Outputs

- `impact-assessment`: For the proposed change: every requirement, design element, interface, budget, and verification event affected, with the nature of the impact (tightened, relaxed, invalidated, new)
- `cost-schedule-estimate`: Engineering effort, retest scope, procurement changes, and schedule impact of implementing the change
- `change-recommendation`: Accept, reject, or modify the change request, with rationale grounded in the impact assessment

## Process

1. Starting from the changed requirement, trace forward through the traceability matrix to find every child requirement, design element, and verification event affected. Also trace backward: if a system requirement changes, check whether the parent need still supports the change, or whether the need itself has changed.
2. For each affected item, classify the impact: tightened (harder to meet, may require redesign), relaxed (easier to meet, potential cost savings), invalidated (no longer applicable, can be removed), or new (the change creates a requirement that did not exist). For budgets, recalculate whether the allocation still closes with margin.
3. Estimate the cost of each impact. Hardware redesign has different cost depending on the phase: a change during detailed design costs 10x what it costs during conceptual design. A change after qualification testing can cost 100x. Include retest scope: if a verified requirement changes, the verification event must be repeated.
4. Present the impact assessment to the change control board with a recommendation. The recommendation should balance technical risk, cost, and schedule impact against the value of the change. Some changes are mandatory (regulatory update) regardless of cost. Others are discretionary and should be evaluated against the program baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
