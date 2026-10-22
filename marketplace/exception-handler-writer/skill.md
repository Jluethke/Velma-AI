# Exception Handler Writer

For each step, document what to do when it goes wrong. Procedures fail at exception points, not at the happy path. If the exception handling says 'contact the manager,' the procedure is incomplete.

## Inputs

- `raw-steps`: The observed steps
- `decision-points`: Where choices are made

## Outputs

- `complete-steps`: Each step now includes: action, completion indicator, common failures, and what to do for each failure
- `escalation-criteria`: Specific conditions under which the procedure executor should stop and escalate, not a vague 'if unsure'

## Process

1. For each step, list the things that can go wrong (system down, unexpected value, missing input, permission denied).
2. For each failure, write the recovery action. If the recovery is 'try again,' specify how many times and what to do if retries fail.
3. Escalation criteria must be specific: 'If the error code is X or the value exceeds Y, stop and escalate to [role] with [information].'
4. 'Contact the manager' is not exception handling. What does the manager do? Write THAT down.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
