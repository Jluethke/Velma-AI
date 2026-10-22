# Hyperparameter Tuner

Tune hyperparameters for the selected algorithms.

## Inputs

- `candidate-algorithms`: Algorithms to tune
- `train-set`: Training data

## Outputs

- `tuned-models`: Models with optimized hyperparameters
- `tuning-results`: Results from all hyperparameter combinations tried

## Process

1. Define the search space for each algorithm's hyperparameters.
2. Run the search (grid, random, or Bayesian optimization) with cross-validation.
3. Track all trials with parameters and scores.
4. Select the best configuration per algorithm.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
