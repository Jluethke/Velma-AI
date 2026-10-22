# Failure Path To Avoidance Rule

Convert each failure path into an avoidance rule. The avoidance rule is a specific, actionable behavior that prevents the failure path from occurring. 'Ignore customer feedback' inverts to 'talk to 5 customers per week and log what they said'. Every avoidance rule must be concrete enough to put on a calendar or a checklist.

## Inputs

- `failure-paths`: The enumerated failure paths
- `non-obvious-paths`: The non-obvious subset

## Outputs

- `avoidance-rules`: For each failure path: the specific behavior that prevents it
- `high-leverage-rules`: The avoidance rules that prevent multiple failure paths simultaneously

## Process

1. For each failure path, write the opposite as a specific action. Not 'communicate better' but 'send a weekly written update with the 3 biggest changes and why they happened'.
2. Test each rule: if you followed this rule, would the failure path be blocked? If not, the rule is too weak.
3. Identify rules that block multiple failure paths. These are high-leverage: one behavior prevents several failure modes.
4. Prioritize the high-leverage rules. A strategy built on 3 high-leverage avoidance rules beats one built on 15 narrow ones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
