# Override Test And Gut Check

Run the override test: if the matrix says X but your gut says Y, investigate the gap. The gap usually means either (a) you left out a criterion that your gut is weighting, (b) you weighted something wrong, or (c) your gut is responding to information that is hard to quantify. Do not override the matrix without naming the reason. Do not follow the matrix if your gut strongly disagrees without investigating why.

## Inputs

- `matrix-recommendation`: What the matrix says
- `weighted-totals`: The full ranking

## Outputs

- `gut-check-result`: Whether your gut agrees with the matrix, and if not, what the source of the disagreement is
- `final-decision`: The decision after reconciling the matrix and the gut check, with the reasoning

## Process

1. Look at the matrix recommendation. Does it feel right? If yes, proceed with the matrix choice.
2. If it feels wrong, name what the matrix is missing. Is there a criterion you did not include? Is a weight wrong?
3. If you can name the missing factor, add it to the matrix and re-run. The matrix should be a tool that captures your reasoning, not a black box that overrides it.
4. If you cannot name the factor, take 24 hours. The gap between analysis and intuition often resolves with time.
5. Record the final decision and whether it followed the matrix, overrode it, or reconciled the gap.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
