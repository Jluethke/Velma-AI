# Product Categorization Tagger

Categorize and tag products for navigation, filtering, and search.

## Inputs

- `product-descriptions`: Product descriptions to categorize
- `product-schema`: Schema with category definitions

## Outputs

- `categorized-catalog`: Products assigned to categories and tags
- `taxonomy-map`: Category hierarchy and tag taxonomy

## Process

1. Build the category hierarchy (department, category, subcategory).
2. Define filter attributes per category (size, color, material, brand).
3. Assign products to categories and apply tags.
4. Validate that every product has at least one category and required tags.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
