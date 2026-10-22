# Downstream Effect Check

Walk each intervention forward through the causal chain to confirm it actually prevents the original symptom and to surface side effects it may create elsewhere. A fix that moves the problem is not a fix.

## Inputs

- `intervention-options`: Candidate interventions
- `prevention-mechanism`: Stated mechanism for each

## Outputs

- `prevented-symptoms`: Downstream symptoms each intervention stops
- `side-effect-watchlist`: New risks or shifted load each intervention may create

## Process

1. Trace each intervention forward and confirm the original symptom can no longer form by that path.
2. List any other symptoms the same change prevents, which raises its value.
3. List any new load or risk the change pushes onto another part of the system.
4. Flag interventions that only relocate the symptom rather than removing its cause.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
