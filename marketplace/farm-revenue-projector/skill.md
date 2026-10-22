# Farm Revenue Projector

Project revenue by crop and market channel.

## Inputs

- `crop-plan`: Crops, acreage, and expected yields
- `market-prices`: Current and forward commodity prices

## Outputs

- `revenue-forecast`: Projected gross revenue by crop
- `price-risk-assessment`: Sensitivity of revenue to price changes

## Process

1. Calculate gross revenue per crop from yield and price.
2. Model price scenarios (low, base, high) for each commodity.
3. Assess revenue risk from yield variability.
4. Identify the crops with highest revenue certainty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
