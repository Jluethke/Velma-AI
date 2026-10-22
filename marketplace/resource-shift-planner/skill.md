# Resource Shift Planner

Plan the resource shift: how much to pull from saturating channels, how much to invest in alternatives, and how fast to make the transition.

## Inputs

- `reallocation-candidates`: Channels to shift resources into
- `saturation-diagnosis`: Saturating channels and their remaining runway

## Outputs

- `reallocation-plan`: Month-by-month budget shift from saturating to growing channels, with expected CPA and volume at each stage
- `risk-mitigation-steps`: What to do if the alternative channel underperforms during ramp-up

## Process

1. Do not cut the saturating channel to zero. Reduce spend to the point where marginal CPA equals your profitability threshold. This captures the remaining value without overpaying.
2. Allocate the freed budget to alternatives in proportion to their expected efficiency (lower CPA, higher ceiling first).
3. Plan for the ramp: new channels often underperform in the first 30-60 days. Build a bridge budget that accepts higher CPA during ramp-up.
4. Set the kill criteria: if an alternative channel does not reach its target CPA within 90 days, reallocate again.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
