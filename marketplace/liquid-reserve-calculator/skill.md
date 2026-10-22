# Liquid Reserve Calculator

Calculate the total liquid reserves: cash and assets that can be converted to cash within 5 business days without significant loss.

## Inputs

- `asset-list`: All assets with their type, balance, and liquidity (how quickly can they be converted to cash and at what cost)
- `credit-facilities`: Available but undrawn credit lines, their limits, and their costs

## Outputs

- `liquid-reserves`: Total immediately available reserves: cash plus near-cash assets, with the time to access each
- `extended-reserves`: Total reserves including assets that take 30-90 days to liquidate, minus the expected liquidation discount

## Process

1. List every asset. Classify by liquidity: tier 1 (cash, checking, savings, money market: available in 1-2 business days), tier 2 (stocks, bonds, CDs: available in 3-5 business days with potential market loss), tier 3 (real estate, equipment, inventory: 30-90+ days to liquidate with significant discount).
2. Calculate liquid reserves: tier 1 plus tier 2 minus any locked or restricted funds.
3. Calculate extended reserves: liquid reserves plus tier 3 minus the estimated liquidation discount (typically 20-40% for fire-sale conditions).
4. Note available credit lines separately. Credit is not a reserve (it must be repaid with interest), but it extends the runway at a cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
