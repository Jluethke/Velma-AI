# Attack Timeline Builder

Build the attack timeline from correlated events showing the sequence of attacker actions.

## Inputs

- `correlated-events`: Cross-source correlated event groups
- `normalized-logs`: Full normalized log set for gap filling

## Outputs

- `attack-timeline`: Chronological sequence of attacker actions with evidence
- `timeline-confidence`: Confidence rating for each timeline entry

## Process

1. Order correlated events into a chronological sequence
2. Identify the probable initial access point
3. Trace lateral movement and privilege escalation steps
4. Assign confidence levels based on evidence strength

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
