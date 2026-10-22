# Stage Time Measurement

Measure the average time deals spend in each stage of your sales pipeline.

## Inputs

- `pipeline-data`: Deals from the past 6-12 months with dates they entered and exited each stage
- `pipeline-stages`: The stages in your sales process (e.g., lead, qualified, proposal, negotiation, closed)

## Outputs

- `stage-times`: Average time in each stage (in days) for both won and lost deals
- `total-cycle-time`: Average total time from first contact to close (win or lose)

## Process

1. For each deal, calculate the number of days it spent in each stage. Use actual stage transition dates from your CRM, not estimates.
2. Calculate the average and median time per stage. The median is more useful than the average because a few very long deals can skew the average.
3. Calculate separately for won deals and lost deals. Deals that will be lost often linger in the pipeline longer than deals that will be won.
4. Identify the stage with the longest average duration. This is the bottleneck stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
