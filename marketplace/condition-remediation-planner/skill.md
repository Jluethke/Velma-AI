# Condition Remediation Planner

Design remediation actions that change the conditions, not just address the proximate cause. Fixing the proximate cause prevents the exact same incident. Fixing the conditions prevents the entire class of incidents.

## Inputs

- `persistent-conditions`: Conditions that still exist
- `defense-failures`: Barriers that need repair

## Outputs

- `condition-fixes`: Specific actions to change each persistent condition, with owner and deadline
- `defense-repairs`: Specific actions to repair or strengthen each failed defense barrier

## Process

1. For each persistent condition, design a structural fix. 'Remind people to be careful' is not a structural fix. Changing the staffing model, redesigning the procedure, or replacing the tool are structural fixes.
2. For each failed defense, repair it. If the defense cannot be made reliable, add a second defense behind it (defense in depth).
3. Prioritize fixes by: conditions that contributed to the most defense failures first, then defenses closest to the point of no return.
4. Assign each fix an owner and a deadline. Track completion. An unfixed condition is a prediction of the next incident.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
