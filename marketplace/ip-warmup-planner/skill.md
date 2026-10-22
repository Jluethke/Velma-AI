# Ip Warmup Planner

Plan and execute an IP or domain warmup for new sending infrastructure.

## Inputs

- `infrastructure-fixes`: Fixes applied to the sending infrastructure
- `content-guidelines`: Content guidelines to follow during warmup

## Outputs

- `warmup-plan`: Day-by-day warmup schedule with volume targets and ISP distribution
- `warmup-metrics`: Tracking metrics during warmup (delivery rate, bounce rate, complaint rate per day)

## Process

1. Determine the target daily sending volume after warmup.
2. Build the warmup schedule starting at a low volume and doubling every 2 to 3 days.
3. Select the most engaged subscribers for early warmup sends.
4. Define the abort criteria (bounce rate above 5%, complaint rate above 0.1%).
5. Document the warmup plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
