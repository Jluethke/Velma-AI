# Qa Scorer

Score sampled interactions and calibrate reviewers.

## Inputs

- `review-sample`: Tickets to score
- `scoring-guidelines`: How to apply the scorecard

## Outputs

- `scored-interactions`: Scores per interaction per criterion
- `calibration-notes`: Notes from reviewer calibration sessions

## Process

1. Score each interaction against the scorecard.
2. Flag disagreements between reviewers for calibration.
3. Run monthly calibration sessions to align scoring.
4. Record calibration decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
