# Alternative Channel Evaluator

Evaluate alternative channels where resources could shift. Compare the CPA, volume ceiling, and ramp time for each alternative.

## Inputs

- `saturation-diagnosis`: Which channels are saturating and why
- `addressable-audience-estimates`: Remaining audience in each channel

## Outputs

- `alternative-channel-comparison`: Each alternative channel rated on: expected CPA, volume ceiling, ramp time to reach steady state, and overlap with saturating channel's audience
- `reallocation-candidates`: The top 2-3 channels to shift resources into, with expected impact

## Process

1. List channels not currently active or underinvested. For each, research the typical CPA range for your category.
2. Estimate the volume ceiling: how many acquisitions per month can this channel realistically produce?
3. Estimate the ramp time: how long from first spend to steady-state CPA? Paid channels ramp in weeks. Content and SEO ramp in months. Partnerships ramp in quarters.
4. Check audience overlap: if the saturating channel and the alternative reach the same people, shifting budget just moves the problem.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
