# Weighted Total Calculator

Calculate the weighted total for each option: multiply each criterion score by its weight, then sum. Rank the options by weighted total. The highest-scoring option is the matrix recommendation.

## Inputs

- `score-matrix`: The scores for each option on each criterion
- `weighted-criteria`: The criteria weights

## Outputs

- `weighted-totals`: Each option's weighted total score, ranked
- `matrix-recommendation`: The highest-scoring option per the matrix

## Process

1. For each option, multiply each criterion score by the criterion weight.
2. Sum the weighted scores to get the total for each option.
3. Rank the options by weighted total.
4. Check for close calls: if the top two options are within 5% of each other, the matrix cannot distinguish them. Other factors should decide.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
