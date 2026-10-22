# Fine Tune Trainer

Execute the fine-tuning job and monitor progress.

## Inputs

- `training-config`: Training configuration
- `formatted-dataset`: Training dataset

## Outputs

- `trained-model`: Fine-tuned model checkpoint
- `training-log`: Loss curves, metrics, and training events

## Process

1. Launch the training job with the configuration.
2. Monitor loss curves for divergence or overfitting.
3. Save checkpoints at regular intervals.
4. Select the best checkpoint by validation loss.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
