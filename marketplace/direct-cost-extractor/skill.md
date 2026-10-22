# Direct Cost Extractor

Extract all direct costs for the product, service, or activity being analyzed.

## Inputs

- `analysis-subject`: The product, service, subscription, or activity to analyze
- `cost-data`: Available cost records: invoices, receipts, price lists, or estimates

## Outputs

- `direct-costs`: All direct costs: purchase price, materials, labor billed, fees, and any other costs explicitly tied to this subject
- `direct-cost-per-unit`: Direct cost divided by the unit of consumption (per use, per month, per item produced)

## Process

1. List every cost that is explicitly and solely tied to this subject. For a subscription: the monthly fee. For a product: materials plus manufacturing labor. For an activity: the direct expenses incurred each time.
2. Identify recurring versus one-time direct costs. A $200 annual subscription is $16.67/month recurring. A $500 setup fee is one-time and should be amortized over the expected usage period.
3. Calculate the direct cost per unit of consumption. Define the unit first: per use (gym membership), per item (product manufacturing), per hour (consulting), or per month (SaaS subscription).
4. This is where most cost analyses stop. The direct cost is typically 40 to 60% of the true cost. The remaining steps calculate the rest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
