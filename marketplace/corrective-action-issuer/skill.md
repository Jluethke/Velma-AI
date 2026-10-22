# Corrective Action Issuer

Issue corrective actions for safety violations found during the inspection.

## Inputs

- `inspection-findings`: Findings from the safety walk
- `violation-photos`: Photos of violations

## Outputs

- `corrective-actions`: Corrective actions issued with deadlines
- `stop-work-orders`: Any stop-work orders for imminent danger conditions

## Process

1. Issue a corrective action for each violation with a specific deadline.
2. Issue a stop-work order for any imminent danger conditions.
3. Notify the responsible subcontractor in writing.
4. Log each action in the safety tracking system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
