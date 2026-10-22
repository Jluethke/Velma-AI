# Mda Cut Dollar Tester

For each line, test whether one hundred fewer dollars would be felt.

## Inputs

- `spend-inventory`: The grouped list of spending lines
- `baseline-totals`: Current totals for sizing a cut

## Outputs

- `cut-pain-scores`: Pain score for removing a marginal hundred dollars from each line
- `low-pain-lines`: Lines where a cut would barely be felt

## Process

1. For each line, estimate the pain of removing a marginal hundred dollars.
2. Score the pain from none to severe.
3. Flag the lines where a cut would barely be felt.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
