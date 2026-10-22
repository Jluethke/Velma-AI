# Panel Fatigue Manager

Monitor and manage panel fatigue to maintain engagement and data quality.

## Inputs

- `panel-registry`: The panel registry with participation history
- `invitation-metrics`: Acceptance rates by segment

## Outputs

- `fatigue-report`: Panel fatigue indicators by segment (declining acceptance, attrition spikes)
- `panel-management-plan`: Full panel management plan with recruitment, scheduling, and fatigue controls

## Process

1. Track acceptance rates over time and flag segments where rates are declining.
2. Enforce frequency caps (maximum invitations per month, minimum gap between sessions).
3. Rotate members within segments so the same individuals are not always selected.
4. Trigger recruitment for segments where active membership drops below the target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
