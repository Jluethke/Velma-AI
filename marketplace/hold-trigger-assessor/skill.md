# Hold Trigger Assessor

Assess the hold trigger and determine whether a litigation hold is required.

## Inputs

- `trigger-event`: The event triggering the hold assessment (lawsuit, demand letter, investigation, regulatory inquiry)
- `matter-details`: Details about the underlying matter or dispute

## Outputs

- `hold-decision`: Decision on whether to issue a hold and the rationale
- `hold-scope`: Scope of the hold: custodians, data types, and date range

## Process

1. Evaluate the trigger event to determine whether a duty to preserve exists.
2. Define the scope of the hold: which custodians, what data types, and what date range.
3. Document the rationale for the hold decision.
4. If no hold is required, document the reasons and close.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
