# Two Way Door Fast Decider

For every two-way door decision, make it now. The optimal process for a two-way door is: pick the option that seems 60% right, try it, and reverse if needed. Spending more time analyzing a two-way door past the 60% threshold is waste because the cost of being wrong is less than the cost of delay.

## Inputs

- `classified-decisions`: Decisions classified by door type

## Outputs

- `two-way-decisions-made`: Each two-way door decision with the choice made and the reversal trigger (what would cause you to reverse it)
- `time-recovered`: Estimated time freed up by making these decisions now instead of deliberating further

## Process

1. Take every two-way door decision. For each, pick the option that seems slightly better right now.
2. Write down the reversal trigger: what specific observation would tell you to reverse the decision?
3. Set a check-in date (1 to 4 weeks) to evaluate whether the decision is working.
4. Move on. Do not second-guess. The whole point is that reversal is cheap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
