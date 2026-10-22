# Change Implementer

Implement the change and verify success.

## Inputs

- `change-request`: The change request with implementation steps
- `change-schedule`: The scheduled window

## Outputs

- `implementation-result`: Success or failure with details
- `change-record`: Final change record with timeline and outcome

## Process

1. Execute the change steps per the implementation plan.
2. Run verification tests after each step.
3. If any step fails, execute the rollback procedure.
4. Document the outcome in the change record and close.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
