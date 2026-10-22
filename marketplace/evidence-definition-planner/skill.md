# Evidence Definition Planner

Define, in advance, what evidence would move your probability up or down. For each piece of evidence you expect to encounter, state how much it should update your belief. This must be done BEFORE seeing the evidence. If you define update rules after seeing the evidence, you will unconsciously calibrate them to reach the conclusion you already want.

## Inputs

- `stated-prior`: The prior probability
- `hypothesis`: The hypothesis being evaluated

## Outputs

- `evidence-plan`: For each expected piece of evidence: what finding would increase the probability, what finding would decrease it, and by roughly how much
- `strongest-evidence`: The single piece of evidence that would move the probability the most in either direction

## Process

1. List the pieces of evidence you expect to encounter (test results, reference checks, market data, etc.).
2. For each, define the update direction: what result would increase your probability? What result would decrease it?
3. Estimate the update magnitude. Strong evidence (a failed drug trial) moves the probability a lot. Weak evidence (one person's anecdote) moves it a little.
4. Identify the single strongest piece of evidence: the one that would move you the most. Seek that evidence first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
