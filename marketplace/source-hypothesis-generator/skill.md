# Source Hypothesis Generator

Generate hypotheses about the source and mode of transmission based on descriptive epidemiology.

## Inputs

- `line-list`: Case data with exposure histories
- `attack-rates`: Group-specific attack rates
- `epidemic-curve`: Temporal pattern of the outbreak

## Outputs

- `hypothesis-list`: Ranked list of plausible source and transmission hypotheses
- `exposure-comparison`: Exposure frequencies among cases vs non-cases (2x2 tables)

## Process

1. Interview cases about common exposures (food, water, events, contacts, travel)
2. Compare exposure frequencies between cases and non-cases
3. Identify exposures with the highest relative risk or odds ratio
4. Rank hypotheses by strength of the descriptive association

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
