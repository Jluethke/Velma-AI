# Rs Confusion Matrix Validator

Validate the classifier against the independent validation samples and compute accuracy metrics.

## Inputs

- `trained-classifier`: Fitted classification model
- `validation-samples`: Independent labeled validation data

## Outputs

- `confusion-matrix`: Full confusion matrix with per-class producer and user accuracy
- `accuracy-metrics`: Overall accuracy, kappa coefficient, and F1 per class

## Process

1. Predict classes for all validation sample locations.
2. Build the confusion matrix comparing predicted vs reference classes.
3. Compute overall accuracy, Cohen's kappa, and per-class producer/user accuracy and F1.
4. Identify classes with poor accuracy and assess whether more training data or class merging is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
