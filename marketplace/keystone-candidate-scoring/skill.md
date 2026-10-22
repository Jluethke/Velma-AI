# Keystone Candidate Scoring

Score each keystone candidate by: number of downstream behaviors, your current ability to adopt it, and whether it has a natural feedback loop.

## Inputs

- `causal-map`: The directed graph of behavior connections
- `upstream-counts`: How many behaviors each one sits upstream of

## Outputs

- `keystone-scores`: Each candidate scored on three dimensions: downstream impact, adoptability, and feedback loop strength
- `top-keystone`: The single best keystone habit candidate with the rationale for choosing it

## Process

1. Score downstream impact (1-10): how many other behaviors does this one cascade into? The more, the higher the score.
2. Score adoptability (1-10): how hard is this behavior to start? A behavior you have tried and failed 5 times scores low. A behavior that requires only a small environment change scores high.
3. Score feedback loop strength (1-10): does this behavior produce a noticeable reward quickly? Exercise produces endorphins within 30 minutes (strong loop). Saving money produces no immediate reward (weak loop).
4. Multiply the three scores. The highest total is your keystone habit. If two are close, pick the one with higher adoptability (you need to actually do it for the cascade to start).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
