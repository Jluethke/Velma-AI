# Corpus Minimization Manager

Minimize and maintain the corpus so coverage is preserved and future campaigns start strong.

## Inputs

- `seed-corpus`: Initial inputs that exercise diverse target paths
- `campaign-results`: Coverage growth, executions, and timing of the run

## Outputs

- `minimized-corpus`: Smallest corpus that preserves achieved coverage
- `corpus-maintenance-plan`: How the corpus and harness are kept current

## Process

1. Merge campaign-discovered inputs into the working corpus
2. Minimize the corpus to the smallest set that holds coverage
3. Store the minimized corpus for reuse as a future seed
4. Define when to refresh the harness and rerun the campaign

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
