# Change Request Evaluation

Evaluate proposed engineering changes for technical impact, cost, schedule, and interchangeability, and present them to the configuration control board for disposition.

## Inputs

- `functional-baseline`: Current functional baseline
- `allocated-baseline`: Current allocated baseline
- `product-baseline`: Current product baseline

## Outputs

- `change-impact-analysis`: For each proposed change: affected CIs, affected baselines, interchangeability impact (Class I: form/fit/function change; Class II: no interchangeability impact), retest scope, cost, and schedule
- `ccb-package`: Complete change request package for the configuration control board: problem statement, proposed solution, impact analysis, alternatives considered, recommendation
- `change-disposition`: CCB decision: approve, approve with modifications, defer, or reject, with rationale and implementation instructions

## Process

1. Classify the change. Class I changes affect form, fit, or function: the changed unit is not interchangeable with the unchanged unit. These require customer notification (if applicable), spare parts updates, retrofit decisions for fielded units, and updated technical manuals. Class II changes do not affect interchangeability: process improvements, documentation corrections, alternative component selections that meet the same specification.
2. Perform technical impact analysis. Trace the changed CI through the requirements traceability matrix and interface control documents to identify every affected element. If changing a component value on a circuit board, check: does it affect the interface to any other board? Does it change the thermal dissipation? Does it change the reliability prediction? Does it require a new revision of the schematic, layout, BOM, and assembly drawing?
3. Estimate cost and schedule impact. Include: engineering effort to implement the change, procurement of new materials, tooling changes, rework of existing inventory (WIP, finished goods, fielded units), requalification testing, documentation updates, and the schedule impact of each. Compare against the cost of not making the change.
4. Present the complete package to the CCB. The CCB includes representatives from engineering, manufacturing, quality, logistics, and program management. The recommendation should be clear: approve and implement at the next production lot, approve and retrofit all fielded units, approve for new production only, or defer to a future product upgrade.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
