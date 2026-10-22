# Nlp Model Trainer

Train the NLP model for the target task.

## Inputs

- `text-features`: Feature representations
- `prepared-corpus`: Labeled corpus for training

## Outputs

- `trained-nlp-model`: The trained NLP model
- `training-history`: Loss and metric curves during training

## Process

1. Split into train, validation, and test sets.
2. Train the model (logistic regression, SVM, LSTM, transformer fine-tuning).
3. Monitor validation metrics during training to prevent overfitting.
4. Select the best checkpoint based on validation performance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
