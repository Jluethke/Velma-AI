# Rs Classifier Trainer

Train the land cover classifier on the selected features and training samples.

## Inputs

- `selected-features`: Feature set to use for classification
- `training-samples`: Labeled training data

## Outputs

- `trained-classifier`: Fitted classification model with parameters
- `training-accuracy`: Cross-validated accuracy on training data

## Process

1. Select the classifier algorithm (random forest, SVM, or gradient boosting).
2. Tune hyperparameters using cross-validation on the training set.
3. Train the final model on all training samples with optimal hyperparameters.
4. Record out-of-bag or cross-validation accuracy as an initial performance estimate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
