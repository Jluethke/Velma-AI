# Escalation Communication Template Set

Write templates for escalation messages at each severity level. Templates reduce the time to escalate and ensure the receiver gets the information they need to act.

## Inputs

- `severity-levels`: The severity tiers
- `receiver-map`: Who receives each level

## Outputs

- `template-set`: Message templates for each severity level: what happened, what is affected, what has been tried, what is needed
- `information-checklist`: The minimum information required for each severity level before escalating

## Process

1. For each severity level, write a template with these fields: what happened (one sentence), what is affected (systems, customers, revenue), what has been tried, what is needed from the receiver.
2. Keep templates to 5 lines maximum. The receiver should be able to read it in 30 seconds.
3. Include an information checklist: the minimum facts needed before escalating. For Level 1, the checklist is short (what and how bad). For Level 3, it is longer (what, why, what you tried).
4. Template language should be neutral and factual. No apologies, no blame, no speculation about cause. Facts only.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
