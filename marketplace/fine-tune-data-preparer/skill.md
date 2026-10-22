# Fine Tune Data Preparer

Prepare and validate the training dataset for fine-tuning.

## Inputs

- `raw-dataset`: Source data for fine-tuning
- `task-definition`: What the fine-tuned model must do

## Outputs

- `formatted-dataset`: Dataset in the required format (JSONL, chat format)
- `data-report`: Statistics on the dataset (size, distribution, quality)

## Process

1. Convert the data to the required format (instruction/response pairs or chat).
2. Clean duplicates, low-quality examples, and formatting errors.
3. Split into train, validation, and test sets.
4. Validate the format against the training platform requirements.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
