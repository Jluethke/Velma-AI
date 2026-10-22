# Competitor Price Analyzer

Analyze competitor pricing across the product catalog.

## Inputs

- `product-catalog`: Products to price
- `competitor-list`: Competitors to monitor

## Outputs

- `competitor-pricing`: Competitor price data by SKU
- `price-position`: Current price position relative to competitors

## Process

1. Collect competitor prices for overlapping SKUs.
2. Calculate the price index (your price / average competitor price).
3. Identify where you are above, at, or below market.
4. Flag products with MAP (minimum advertised price) constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
