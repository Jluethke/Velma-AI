# Transaction Tax Calculator

Calculate the correct sales tax on each transaction based on product type and jurisdiction.

## Inputs

- `transaction-data`: Sales transactions with product details and ship-to addresses
- `tax-rate-table`: Tax rates by jurisdiction, product category, and exemption

## Outputs

- `taxed-transactions`: Transactions with calculated tax amounts
- `exemption-log`: Transactions exempt from tax with reason codes

## Process

1. Determine the taxing jurisdiction based on the ship-to address.
2. Look up the applicable tax rate for the product category.
3. Apply exemptions (resale certificates, tax-exempt customers, exempt products).
4. Calculate the tax amount for each transaction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
