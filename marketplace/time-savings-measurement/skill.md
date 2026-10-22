# Time Savings Measurement

Measure the time saved by early disqualification and the impact on win rate for the remaining qualified pipeline.

## Inputs

- `exit-scripts`: The disqualification protocol
- `deal-history`: Historical data for comparison

## Outputs

- `time-savings`: Hours per month saved by not pursuing deals that would have been lost anyway
- `win-rate-improvement`: The change in win rate for the qualified pipeline (expected to increase because low-probability deals are removed)

## Process

1. Calculate time saved: (number of disqualified prospects per month) x (average hours spent on a lost deal). If you disqualify 10 prospects per month and each lost deal consumed 8 hours, you save 80 hours/month.
2. Measure the win rate of the qualified pipeline (deals that passed disqualification). It should be higher than the overall win rate before disqualification was implemented.
3. Reallocate the saved time to the qualified pipeline. More time per qualified deal means better discovery, better proposals, and better follow-up, which further improves win rate.
4. The compounding effect: early disqualification saves time, which is reinvested in qualified deals, which improves win rate, which generates more revenue per hour of sales effort.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
