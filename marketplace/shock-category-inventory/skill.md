# Shock Category Inventory

Inventory the four shock categories (health, income, market, infrastructure) and your current exposure in each.

## Inputs

- `current-situation`: A description of your personal or business situation: income sources, health status, assets, dependencies
- `obligations`: Monthly financial obligations and non-financial commitments that cannot be paused

## Outputs

- `shock-exposure-map`: For each category (health, income, market, infrastructure): the worst plausible shock, the time to impact, and the current buffer
- `single-points-of-failure`: Dependencies where a single shock eliminates the resource entirely with no backup

## Process

1. For health: what happens if you (or the key person) cannot work for 6 months? What is the income impact, the care cost, and who handles the obligations?
2. For income: what happens if the largest income source disappears in 30 days? How many months of obligations can current reserves cover?
3. For market: what happens if the market your business serves contracts by 50%? Or if the investment portfolio drops by 40%?
4. For infrastructure: what happens if you lose your home, your primary workspace, or your critical technology for 30 days?
5. Mark any category where the buffer is less than 3 months of obligations as 'fragile.'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
