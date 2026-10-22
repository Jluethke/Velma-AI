# Activation Drop Off Measurer

Measure drop-off at each step between sign-up and activation.

## Inputs

- `activation-steps`: The steps in the activation path
- `activation-milestone`: The target milestone

## Outputs

- `step-conversion-rates`: The percentage of users who complete each step, sequentially
- `highest-drop-step`: The step with the worst conversion rate: this is the activation bottleneck

## Process

1. For each step, count: how many users reached this step, and how many advanced to the next? Calculate the conversion rate.
2. Also measure: how long does each step take? Steps that take too long have friction even if the conversion rate looks acceptable.
3. Identify the highest-drop step: where do you lose the most users? This is the bottleneck.
4. Calculate the overall activation rate: percentage of sign-ups who reach the activation milestone. This is the headline metric for the activation sequence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
