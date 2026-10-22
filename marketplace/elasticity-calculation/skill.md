# Elasticity Calculation

Calculate the price elasticity of demand and determine whether the price increase should be kept.

## Inputs

- `test-results`: Volume and revenue during the test
- `baseline-metrics`: Pre-test baseline

## Outputs

- `elasticity-coefficient`: The price elasticity: percentage change in volume divided by percentage change in price. Below 1.0 means inelastic (price increase is profitable). Above 1.0 means elastic (price increase lost revenue).
- `keep-or-revert-decision`: Whether to keep the new price, revert, or test a smaller increase

## Process

1. Calculate elasticity: (% change in volume) / (% change in price). If you raised the price 10% and volume dropped 5%, elasticity is 0.5 (inelastic - keep the increase).
2. Inelastic (below 1.0): the price increase is profitable because the revenue gain from higher price exceeds the revenue loss from lower volume. Keep the new price.
3. Elastic (above 1.0): the price increase lost revenue because the volume drop was too large. Revert to the old price or test a smaller increase.
4. If inelastic, consider testing another 10% increase. Many businesses are significantly underpriced and can sustain multiple increases before hitting the elastic threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
