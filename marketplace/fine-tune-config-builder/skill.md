# Fine Tune Config Builder

Configure the training hyperparameters and environment.

## Inputs

- `model-selection`: Base model and method
- `formatted-dataset`: Training dataset

## Outputs

- `training-config`: Full training configuration
- `environment-spec`: Hardware and software requirements

## Process

1. Set the learning rate, batch size, and number of epochs.
2. Configure LoRA rank, alpha, and target modules if applicable.
3. Set early stopping criteria and checkpointing.
4. Document the full configuration for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
