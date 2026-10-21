# Feature Classifier Science

Classify segmented objects into categories based on their morphometric and intensity features.

## Inputs

- `morphometric-table`: Per-object measurements
- `classification-scheme`: Categories and criteria (rule-based thresholds or trained classifier)

## Outputs

- `classified-objects`: Each object assigned to a category with confidence score
- `classification-summary`: Count and proportion per category, confusion matrix if ground truth available

## Process

1. Apply the classification rules or trained model to each object's feature vector.
2. Assign each object to a category with a confidence score.
3. Tabulate counts and proportions per category.
4. If ground truth labels exist, compute the confusion matrix and accuracy metrics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
