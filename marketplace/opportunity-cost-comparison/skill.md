# Opportunity Cost Comparison

The opportunity cost of the proposed commitment is the value of the highest-value alternative you are giving up. If the proposed commitment is worth less than its opportunity cost, it is the wrong choice, even if it has positive expected value. Positive expected value is not enough; it must be the BEST use of those resources.

## Inputs

- `value-estimates`: Expected values for all options
- `highest-value-alternative`: The best alternative

## Outputs

- `opportunity-cost-verdict`: Whether the proposed commitment beats its opportunity cost, with the specific numbers
- `value-gap`: The difference between the proposed commitment and the best alternative (positive means the commitment wins)

## Process

1. Compare the expected value of the proposed commitment against the highest-value alternative.
2. If the commitment wins: proceed, but document the alternative you are giving up (you may want to revisit it later).
3. If the alternative wins: the proposed commitment has a negative opportunity cost. Saying yes to it means saying no to something better.
4. State the value gap in concrete terms. Not 'the alternative is better' but 'the alternative is worth approximately X more over the same period'.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
