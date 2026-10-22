# Naive User Tester

Test the procedure by having someone who did NOT write it attempt to follow it. Every point where they pause, ask a question, or make an error is a defect in the procedure.

## Inputs

- `complete-steps`: The full procedure with exception handling
- `escalation-criteria`: When to stop and escalate

## Outputs

- `test-results`: List of points where the tester paused, asked questions, or made errors, with the procedure defect for each
- `final-procedure`: The corrected procedure after fixing every identified defect

## Process

1. Give the procedure to someone who has not performed it before. Provide no additional guidance. Watch them execute.
2. Record every pause (they are reading something unclear), every question (the procedure omitted information), and every error (the procedure was ambiguous or wrong).
3. For each defect, fix the procedure text. Then have the tester re-execute the fixed section.
4. The procedure is done when a naive user can execute it without pausing, asking, or erring. Version it (v1.0) and set a review date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
