# Frc Stress Tester

Stress the runway against shocks.

## Inputs

- `runway-months`: The base runway to stress
- `burn-breakdown`: The burn categories shocks act on

## Outputs

- `stress-scenarios`: Runway under a revenue drop, a major expense, and a longer timeline
- `worst-case-runway`: The shortest runway across the scenarios

## Process

1. Recompute the runway if revenue drops thirty percent.
2. Recompute the runway if a major expense hits.
3. Recompute the runway if the timeline to profitability doubles.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
