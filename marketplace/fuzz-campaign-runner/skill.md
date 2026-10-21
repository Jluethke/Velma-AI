# Fuzz Campaign Runner

Run the fuzzing campaign against the harness and collect crashes and coverage over time.

## Inputs

- `harness-code`: Harness entry points that drive each fuzz target
- `seed-corpus`: Initial inputs that exercise diverse target paths

## Outputs

- `campaign-results`: Coverage growth, executions, and timing of the run
- `crash-artifacts`: Crashing inputs and their reproduction data

## Process

1. Start the campaign from the seed corpus with defined time or iteration limits
2. Track coverage growth and execution rate to judge progress
3. Save each unique crashing input with its reproduction metadata
4. Stop when coverage plateaus or the limit is reached

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
