# Fatigue Reduction Synthesis

Synthesize the rules, removals, and schedule into a single estimate of the reduced daily decision load and a plan to hold it. The gain is real only if the lighter load survives contact with a normal week.

## Inputs

- `decision-rules`: Rules for automatable decisions
- `elimination-actions`: Source changes removing decisions
- `energy-schedule`: The protected schedule for essential decisions

## Outputs

- `reduced-load-estimate`: The new daily decision count after rules and removals
- `redesign-summary`: The combined changes and how to sustain them

## Process

1. Subtract the automated and eliminated decisions from the original count to estimate the new load.
2. Combine the rules, removals, and schedule into one short operating description of the day.
3. Name the drift risks that would let old decisions creep back in.
4. Set a re-check date to confirm the lighter load held over a full week.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
