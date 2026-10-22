# Escalation Path Designer

Design the escalation path between review levels.

## Inputs

- `review-levels`: The review levels
- `agendas`: Agendas for each level

## Outputs

- `escalation-rules`: When and how items escalate from one level to the next
- `de-escalation-rules`: When items drop back to a lower level

## Process

1. Define escalation triggers (unresolved after N days, exceeds budget threshold, cross-team dependency).
2. Map each trigger to its target level.
3. Define de-escalation criteria (resolved, within tolerance, owner accepted).
4. Produce the escalation and de-escalation rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
