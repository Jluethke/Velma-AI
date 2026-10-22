# Interview Impression Collector

Collect the interviewers' gut impressions and structured interview scores separately from the work sample scores. The purpose is to compare the two signals. If they diverge, the work sample is almost always the better predictor. Document each interviewer's prediction: will this candidate succeed in the role? (yes, maybe, no).

## Inputs

- `blinding-protocol`: The protocol used to blind work samples
- `inter-rater-process`: How scoring disagreements are resolved

## Outputs

- `interview-impressions`: Each interviewer's prediction for each candidate, recorded before seeing work sample scores
- `structured-scores`: Structured interview scores (if conducted) for comparison

## Process

1. After each interview, ask the interviewer to record their prediction: will this candidate succeed in the role within 12 months? Yes, maybe, or no. Plus a one-sentence rationale.
2. Collect all predictions before revealing work sample scores. This prevents anchoring.
3. If structured interviews were conducted, collect those scores separately.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
