# Nutritional Analysis

Analyze the final formulation for macronutrients, micronutrients, and label-relevant components per regulatory method requirements.

## Inputs

- `formulation-matrix`: Final formulation with ingredient percentages
- `target-market`: Regulatory requirements for nutrition labeling

## Outputs

- `nutrition-panel`: Nutrition facts per serving: calories, fat, carbohydrates, protein, sodium, vitamins, minerals
- `label-claims`: Permissible nutrient content claims (low-fat, high-fiber, etc.) based on analytical values

## Process

1. Calculate theoretical nutrition from ingredient database values as a starting point
2. Send samples to an accredited lab for proximate analysis (moisture, ash, fat, protein, fiber, carbohydrate by difference)
3. Analyze micronutrients (vitamins, minerals) relevant to any planned label claims
4. Round values per FDA or local rounding rules and determine eligible nutrient content claims

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
