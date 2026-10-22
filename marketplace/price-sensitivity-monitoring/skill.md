# Price Sensitivity Monitoring

Re-run the Van Westendorp analysis periodically to detect shifts in price sensitivity as the market evolves.

## Inputs

- `recommended-price`: The current price
- `pricing-rationale`: Why it was set there

## Outputs

- `monitoring-schedule`: When to re-run the analysis (annually, or after a major market change)
- `drift-indicators`: Signs that price sensitivity has shifted: conversion rate changes, competitor price movements, customer feedback patterns

## Process

1. Schedule a re-run annually or after a major market change (new competitor, economic shift, product update).
2. Between re-runs, monitor drift indicators: if conversion rate drops without other changes, the price may have crossed the acceptable range. If customers stop mentioning price in objections, you may be underpriced.
3. When re-running, survey a new sample. Do not re-survey the same people; their anchoring to the previous price distorts the results.
4. Compare the new curves to the previous ones. If the acceptable range has shifted upward, you have room to raise prices. If downward, you may need to adjust or add value.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
