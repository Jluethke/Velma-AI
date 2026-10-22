# Catalog Data Quality Validator

Validate the catalog for data quality, completeness, and consistency.

## Inputs

- `variant-catalog`: Complete catalog with variants
- `naming-standards`: Naming convention reference

## Outputs

- `catalog-quality-report`: Data quality validation results
- `catalog-management-plan`: Ongoing catalog maintenance plan

## Process

1. Check every product for required fields (title, description, price, image, category).
2. Validate SKU uniqueness and format compliance.
3. Flag duplicate products and inconsistent pricing.
4. Produce the quality report and define the ongoing review cadence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
