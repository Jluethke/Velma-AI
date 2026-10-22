# Severity Assessor

Assess severity and business impact of each ticket.

## Inputs

- `classified-tickets`: Tickets with categories assigned
- `severity-matrix`: Severity levels and their criteria

## Outputs

- `scored-tickets`: Tickets with severity and impact scores
- `critical-alerts`: Tickets flagged as critical for immediate attention

## Process

1. Evaluate each ticket against the severity matrix.
2. Score impact based on number of users affected and business function.
3. Flag critical tickets for immediate escalation.
4. Attach severity and impact scores to each ticket.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
