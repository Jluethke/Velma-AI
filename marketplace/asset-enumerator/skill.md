# Asset Enumerator

Enumerate every asset you are protecting. An asset is anything whose loss, damage, or exposure would cause material harm.

## Inputs

- `scope-description`: What you are modeling (a business, a household, a product, an IT system, a personal life)
- `harm-definition`: What counts as material harm in this context (financial loss, reputational damage, physical harm, data exposure, time loss)

## Outputs

- `asset-inventory`: Every asset with its type (data, financial, physical, reputational, relational, temporal), its value, and the consequence of its loss
- `crown-jewels`: The top 5 assets whose loss would cause the most damage, ranked by consequence severity

## Process

1. List every asset by type. Data: customer records, financial data, intellectual property, credentials, personal information. Financial: cash, investments, receivables, inventory. Physical: equipment, facilities, vehicles. Reputational: brand trust, professional reputation. Relational: key relationships, contracts. Temporal: time and attention.
2. For each asset, estimate the value: replacement cost for physical assets, revenue impact for business assets, recovery cost for data, and consequence severity for intangible assets.
3. Identify the crown jewels: the 5 assets whose loss would cause the greatest harm. These get the most protection.
4. Note which assets are shared or have dependencies: losing one asset that cascades to losing others is a compounding risk.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
