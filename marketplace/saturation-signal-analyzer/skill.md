# Saturation Signal Analyzer

For each flagged channel, analyze whether the CPA rise is temporary (seasonal, auction fluctuation) or structural (audience exhaustion).

## Inputs

- `channel-baseline-report`: CPA and volume trends per channel
- `channel-health-scores`: Channels scored as growing, stable, or declining

## Outputs

- `saturation-diagnosis`: For each flagged channel: temporary vs structural, evidence for the diagnosis, and estimated remaining runway
- `addressable-audience-estimates`: For each saturating channel: the estimated total addressable audience, the percentage already reached, and the remaining pool

## Process

1. Check for seasonal effects: does this channel always see CPA rises in this quarter? Compare against the same period in prior years if data exists.
2. Check for auction competition: did a new competitor enter the auction? Did platform costs rise across all advertisers? If yes, the rise is market-wide, not saturation.
3. If neither seasonal nor competitive: estimate the total addressable audience in the channel. Compare against cumulative reach. If you have reached over 60% of the addressable audience, structural saturation is likely.
4. Estimate the remaining runway: at current CPA growth rate, when does CPA cross the profitability threshold?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
