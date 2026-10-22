# Experiment Logger

Log the experiment with all parameters, metrics, and artifacts.

## Inputs

- `evaluation-metrics`: Test set performance metrics
- `training-metadata`: Training details and configuration

## Outputs

- `experiment-record`: Logged experiment with all details
- `training-report`: Final model training report

## Process

1. Log the experiment to the tracking system (MLflow, Weights and Biases).
2. Record parameters, metrics, and the model artifact.
3. Tag the experiment with the dataset version and code commit.
4. Write the training report with methodology and results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
