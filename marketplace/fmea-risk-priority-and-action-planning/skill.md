# Fmea Risk Priority And Action Planning

Calculate risk priority numbers, apply action priority as an alternative ranking, identify high-risk items, and assign corrective actions with owners and deadlines.

## Inputs

- `severity-ratings`: Severity scores
- `occurrence-ratings`: Occurrence scores
- `detection-ratings`: Detection scores
- `current-controls`: Existing prevention and detection controls

## Outputs

- `rpn-rankings`: Risk priority number (S x O x D) for each failure mode, sorted highest first, with known RPN limitations documented
- `action-priority-rankings`: Action priority level (High/Medium/Low) using the AIAG-VDA severity-occurrence matrix as an alternative to RPN threshold
- `corrective-action-plan`: For each high-priority item: recommended action (design change, added control, or test), responsible owner, target completion date, and expected new S/O/D after action

## Process

1. Calculate RPN = Severity x Occurrence x Detection for every failure mode. RPN ranges from 1 to 1,000. Document that RPN has known limitations: it treats all factors as equally important, and two failure modes with RPN 180 (e.g., 9x2x10 vs 6x5x6) have very different risk profiles. A severity-9 item with occurrence-2 and detection-10 needs a different action than a severity-6 item with occurrence-5 and detection-6.
2. Apply the AIAG-VDA Action Priority method as a supplement: items with severity 9-10 and occurrence above 4 are always High priority regardless of detection. Items with severity 5-8 and occurrence above 6 are Medium. This captures the cases where RPN ranking alone would miss a safety-critical item with good detection.
3. Assign corrective actions that target the right factor. If severity is the driver, redesign to eliminate the failure mode or add redundancy. If occurrence is the driver, improve the design margin or process capability. If detection is the driver, add a test or monitor. The most effective actions reduce occurrence (prevention), not detection (after the fact).
4. Each action must have a single responsible owner, a target date, and a measurable success criterion. 'Improve the design' is not an action. 'Add current limiting to U3 output per schematic revision B, verified by short-circuit test at final test station' is an action. Track actions to closure and re-score after implementation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
