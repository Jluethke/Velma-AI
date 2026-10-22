# Wbs And Activity Definition

Develop the work breakdown structure and define schedulable activities with durations and dependencies.

## Inputs

- `project-scope`: Contract scope, drawings, specifications, and quantity takeoff
- `construction-method`: Selected construction methods and equipment for major work items

## Outputs

- `activity-list`: Complete list of activities with ID, description, duration, and predecessors/successors
- `wbs-structure`: Hierarchical WBS with cost accounts linked to activities

## Process

1. Decompose scope into WBS. Level 1: project. Level 2: major areas or phases (site preparation, foundations, structure, MEP, finishes, commissioning). Level 3: disciplines or systems within each area. Level 4: work packages (smallest scope element assigned to a single responsible party). Level 5: activities (schedulable tasks within work packages). Ensure every scope item is captured (compare WBS to specification sections and drawing sheets).
2. Define activities. Each activity must have: clear start and completion criteria, a single responsible party, a measurable deliverable, and a duration estimable from production rates. Avoid activities longer than 20 working days (break into smaller pieces for control). Avoid activities shorter than 1 day (aggregate for manageability). Typical project: 500 to 5,000 activities depending on size and complexity.
3. Estimate durations. Production rate method: duration = quantity / (crew size * daily production rate * efficiency factor). Use historical data, RS Means, or subcontractor input for rates. Account for weather: rain days per month from historical records, cold weather productivity reduction (below -10 C: 50% for outdoor concrete, 75% for earthwork). Add mobilization and demobilization time.
4. Define logic relationships. Finish-to-Start (FS): most common, successor starts when predecessor finishes. Start-to-Start (SS): activities start together (parallel work, e.g., excavation and shoring). Finish-to-Finish (FF): activities finish together (e.g., MEP rough-in and inspection). Lags: positive lag for curing time (FS+7d for concrete cure before form strip). Avoid negative lags (leads); restructure logic instead.
5. Include constraints and milestones. Contractual milestones (substantial completion date, sectional completion). External constraints (material delivery dates, permit dates, utility shutdowns, road closures). Physical constraints (concrete pour sequence, crane reach limitations, tower crane climbing schedule). Weather windows (no earthwork in spring thaw, no roofing in winter).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
