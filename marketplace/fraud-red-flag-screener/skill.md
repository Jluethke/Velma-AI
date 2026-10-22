# Fraud Red Flag Screener

Screen claims for fraud red flags and prioritize for investigation.

## Inputs

- `claims-data`: Claims data including reported losses, claimant information, and claim history
- `red-flag-indicators`: List of fraud indicators (inconsistent statements, excessive claim amounts, financial stress, prior claims pattern)

## Outputs

- `flagged-claims`: Claims flagged for investigation with the specific red flags identified
- `investigation-priority`: Priority ranking based on the number and severity of red flags

## Process

1. Screen claims against the red flag indicator list.
2. Cross-reference claimant history for patterns (multiple claims, prior fraud referrals).
3. Score each flagged claim by the number and severity of indicators.
4. Rank the flagged claims by investigation priority.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
