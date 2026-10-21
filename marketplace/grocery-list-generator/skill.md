# Grocery List Generator

Generate a consolidated grocery list from the week's recipes with quantities, store sections, and cost estimate.

## Inputs

- `recipe_list`: All recipes with ingredients
- `pantry_inventory`: What is already on hand

## Outputs

- `grocery_list`: Consolidated shopping list by store section
- `cost_estimate`: Estimated total grocery cost
- `pantry_check`: Items to verify are still in stock

## Process

1. Aggregate ingredients across all recipes
2. Subtract items already in pantry
3. Group by store section for efficient shopping
4. Estimate costs per item
5. Note substitution options for expensive items

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
