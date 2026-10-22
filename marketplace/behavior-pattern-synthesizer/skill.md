# Behavior Pattern Synthesizer

Find the pattern that holds across the performers. Individual interviews contain noise; the pattern is the signal. Keep only behaviors and skills that appear in at least three of the performers studied.

## Inputs

- `posting-reality-gap`: The missing real requirements
- `credential-noise-list`: The requirements that predict nothing

## Outputs

- `validated-pattern`: The behaviors and skills present in at least three of the performers studied
- `pattern-confidence`: For each kept item, the count of performers who exhibited it out of the total studied

## Process

1. Build a matrix with performers as rows and behaviors and hidden skills as columns, marking who exhibits each.
2. Count the frequency of each behavior and skill across the performers.
3. Keep only items present in three or more performers; the rest is individual variation.
4. Record the confidence for each kept item as the count out of the total performers studied.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
