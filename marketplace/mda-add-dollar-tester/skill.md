# Mda Add Dollar Tester

For each line, test whether one hundred more dollars would improve the outcome.

## Inputs

- `spend-inventory`: The grouped list of spending lines

## Outputs

- `add-value-scores`: Benefit score for adding a marginal hundred dollars to each line
- `high-add-lines`: Lines where more money clearly improves the outcome

## Process

1. For each line, estimate the benefit of adding a marginal hundred dollars.
2. Score the benefit from none to high.
3. Flag the lines where more money clearly helps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
