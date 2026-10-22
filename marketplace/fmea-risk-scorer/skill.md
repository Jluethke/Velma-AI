# Fmea Risk Scorer

Score severity, occurrence, and detection for each failure mode.

## Inputs

- `failure-modes`: Failure modes and causes
- `effects-list`: Effects of each failure mode

## Outputs

- `risk-scores`: Severity, occurrence, detection, and RPN for each failure mode
- `ranking`: Failure modes ranked by RPN and severity

## Process

1. Score severity (1 to 10) based on the worst effect of the failure
2. Score occurrence (1 to 10) based on the likelihood of the cause
3. Score detection (1 to 10) based on the ability of current controls to detect before reaching the customer
4. Calculate RPN = severity x occurrence x detection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
