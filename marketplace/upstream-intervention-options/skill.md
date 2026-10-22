# Upstream Intervention Options

Generate concrete interventions at the chosen leverage level and state the mechanism by which each one prevents the downstream symptom. An intervention with no stated mechanism is a hope, not a design.

## Inputs

- `leverage-scored-levels`: Causal levels with leverage scores
- `highest-leverage-level`: The target level for intervention

## Outputs

- `intervention-options`: Candidate changes at the target level
- `prevention-mechanism`: How each option breaks the causal link to the symptom

## Process

1. Generate several distinct interventions that act at the target level, not at the symptom.
2. For each one, write the mechanism: the exact causal link it removes or weakens.
3. Discard any option whose mechanism is really just added inspection or added effort downstream.
4. Keep options that change the condition that produced the cause, so the symptom cannot form.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
