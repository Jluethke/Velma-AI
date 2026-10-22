# Duty Tax Calculator

Determine applicable duties and taxes for classified products.

## Inputs

- `hs-classifications`: HS codes assigned to each product
- `country-of-origin`: Country where each product was manufactured

## Outputs

- `duty-schedule`: Applicable duty rates and tax amounts per product
- `trade-agreement-savings`: Savings available under applicable trade agreements

## Process

1. Look up duty rates for each HS code and origin country
2. Apply trade agreement preferences where eligible
3. Calculate anti-dumping or countervailing duties if applicable
4. Produce the duty schedule with total landed cost estimate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
