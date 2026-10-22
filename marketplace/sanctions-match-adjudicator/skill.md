# Sanctions Match Adjudicator

Review potential matches, escalate confirmed hits, and document the screening decision.

## Inputs

- `potential-matches`: Potential matches requiring review
- `screening-results`: Full screening results

## Outputs

- `screening-decision`: Final decision (cleared, blocked, escalated) for each match
- `screening-record`: Complete screening record with rationale

## Process

1. Review each potential match against available identifying information.
2. Determine whether the match is a true positive, false positive, or inconclusive.
3. Escalate confirmed hits to the compliance officer and block the transaction.
4. Document the decision rationale for the screening record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
