# Hs Code Classifier

Classify products using Harmonized System codes.

## Inputs

- `product-descriptions`: Descriptions and specifications of products to classify
- `country-of-origin`: Country where each product was manufactured

## Outputs

- `hs-classifications`: HS codes assigned to each product
- `classification-notes`: Notes on classification decisions and ruling references

## Process

1. Review product descriptions against the HS tariff schedule
2. Select the most specific classification for each product
3. Document the reasoning for each classification decision
4. Flag products requiring binding ruling requests

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
