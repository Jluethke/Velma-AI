# Hhi Concentration Scorer

Calculate the Herfindahl-Hirschman Index for revenue concentration and interpret the score.

## Inputs

- `stream-inventory`: Each revenue stream with its percentage of total

## Outputs

- `hhi-score`: The HHI score (sum of squared revenue share percentages, expressed as a decimal between 0 and 1)
- `concentration-assessment`: Interpretation: below 0.15 is diversified, 0.15 to 0.25 is moderate, 0.25 to 0.50 is concentrated, above 0.50 is dangerously dependent

## Process

1. Convert each stream's percentage of total revenue to a decimal (e.g., 45% becomes 0.45). Square each decimal. Sum all the squared values. This is the HHI score.
2. Interpret the score: an HHI of 0.10 means no single source dominates (roughly equivalent to 10 equal sources). An HHI of 0.50 means one source contributes about 70% of revenue. An HHI of 1.0 means all revenue comes from one source.
3. Identify the marginal contributors: which streams, if lost, would push the HHI above the next threshold? This tells you which specific streams are load-bearing for diversification.
4. Compare the current HHI to the HHI from 12 months ago (recalculate using the older data). If the HHI is increasing, concentration is getting worse even if total revenue is growing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
