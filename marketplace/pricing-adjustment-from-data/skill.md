# Pricing Adjustment From Data

Use the revenue-per-constraint-hour data to adjust pricing: underprice high-demand/low-constraint work, overprice work that consumes disproportionate constraint time.

## Inputs

- `revenue-per-hour-table`: The ranked table
- `reallocation-plan`: The planned shifts

## Outputs

- `price-adjustments`: Specific price changes for products or services that are mispriced relative to their constraint consumption
- `adjusted-revenue-per-hour`: The updated revenue per constraint hour after price changes

## Process

1. Items with high demand and high revenue per constraint hour may be underpriced. Test a 10-20% price increase and measure volume impact.
2. Items with low revenue per constraint hour and high constraint consumption are overconsuming the bottleneck. Raise the price until either: the revenue per constraint hour is acceptable, or the client leaves (freeing constraint time for better work).
3. Do not feel guilty about raising prices on constraint-heavy work. The alternative is that the constraint spends its time on lower-value activity, which hurts the whole business.
4. Recalculate the full table after price changes to verify the reallocation improved the average revenue per constraint hour.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
