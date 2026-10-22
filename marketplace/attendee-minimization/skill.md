# Attendee Minimization

Limit each meeting to the people who make or directly inform the decision. Every extra attendee multiplies the cost and dilutes the decision, and people who only need the outcome can read the summary.

## Inputs

- `decision-tagged-meetings`: Surviving meetings
- `agenda-standard`: The agenda rule

## Outputs

- `attendee-rules`: Who must attend each meeting and who only needs the summary
- `removed-attendee-hours`: Attendee hours saved by trimming the invite list

## Process

1. For each meeting, identify who actually makes the decision and who directly informs it.
2. Move everyone else to the summary distribution instead of the invite.
3. Confirm the decision can still be made with the trimmed group present.
4. Total the attendee hours saved by shortening the invite lists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
