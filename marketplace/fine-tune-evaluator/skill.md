# Fine Tune Evaluator

Evaluate the fine-tuned model on the held-out test set.

## Inputs

- `trained-model`: Fine-tuned model
- `formatted-dataset`: Dataset with test split

## Outputs

- `eval-results`: Evaluation metrics (perplexity, task-specific scores)
- `fine-tuning-report`: Full report comparing to baseline

## Process

1. Run inference on the test set with the fine-tuned model.
2. Compute task-specific metrics (accuracy, F1, BLEU, etc.).
3. Compare against the base model baseline.
4. Document the improvements and remaining weaknesses.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
