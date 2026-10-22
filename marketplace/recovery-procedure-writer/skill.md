# Recovery Procedure Writer

Write the detailed recovery procedures for each critical activity.

## Inputs

- `recovery-priority-order`: The prioritized list of activities to recover
- `impact-analysis`: The MTDs and RTOs for each activity

## Outputs

- `recovery-procedures`: For each critical activity: the step-by-step recovery procedure, the resources required, the dependencies on other activities, and the success criteria
- `resource-requirements`: The total resources needed for recovery: people, technology, workspace, vendors, and budget, by phase

## Process

1. For each critical activity in priority order, write the recovery procedure: what steps, in what order, by whom, using what resources, with what success criteria?
2. Identify the dependencies: which activities must be recovered before this one can start? Build the dependency sequence.
3. Estimate the resources required at each phase: people (by role), technology (systems, access, licenses), workspace (if the primary is unavailable), vendors (emergency contracts), and budget.
4. Define the success criteria: how do you know the activity is recovered? It should be measurable: 'system is accepting transactions' not 'system is working.'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
