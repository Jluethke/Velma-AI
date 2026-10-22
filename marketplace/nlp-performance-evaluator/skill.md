# Nlp Performance Evaluator

Evaluate the NLP model on the test set.

## Inputs

- `trained-nlp-model`: The trained model
- `text-features`: Test set features

## Outputs

- `nlp-metrics`: Task-specific metrics (F1, accuracy, BLEU, entity-level)
- `error-examples`: Examples of model errors for analysis

## Process

1. Run predictions on the held-out test set.
2. Compute task-specific metrics (classification: F1, accuracy; NER: entity F1; generation: BLEU).
3. Analyze error patterns (which classes or entity types fail).
4. Collect representative error examples for review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
