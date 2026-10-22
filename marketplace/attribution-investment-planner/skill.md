# Attribution Investment Planner

Translate attribution results into investment decisions.

## Inputs

- `selected-model`: The chosen model and output
- `model-comparison`: The cross-model comparison

## Outputs

- `investment-recommendations`: For each channel: increase, decrease, or hold, based on attributed value per dollar
- `attribution-review-schedule`: When to re-run (quarterly) and when to reconsider the model (annually)

## Process

1. Calculate attributed value per dollar spent for each channel. Compare across channels.
2. High value per dollar = increase. Low value per dollar = decrease or investigate.
3. Before cutting: check the channel's role across models. A channel bad on last-touch might be essential on first-touch.
4. Set review schedule: re-run quarterly, re-evaluate model choice annually.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
