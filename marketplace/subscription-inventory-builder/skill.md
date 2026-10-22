# Subscription Inventory Builder

Inventory every active recurring charge across all payment methods.

## Inputs

- `payment-sources`: All credit cards, bank accounts, PayPal, and other payment methods that could carry recurring charges
- `audit-scope`: Personal subscriptions, business SaaS, or both

## Outputs

- `subscription-inventory`: Every recurring charge: name, amount, frequency (monthly, annual, quarterly), payment method, and category
- `total-recurring-cost`: Total monthly cost of all subscriptions combined

## Process

1. Pull 3 months of transactions from every payment source. Filter for recurring charges: same payee appearing in 2 or more consecutive months, or annual charges that appeared in the last 12 months.
2. Capture charges people forget: annual renewals (domains, insurance, memberships), quarterly charges (some SaaS tools), and charges buried in bundles (the streaming add-on inside the phone bill).
3. Normalize all charges to a monthly amount. Annual charges divided by 12. Quarterly divided by 3. This allows direct comparison.
4. Calculate the total monthly recurring cost. This number is usually 30 to 50% higher than people estimate because of the forgotten annual renewals and buried charges.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
