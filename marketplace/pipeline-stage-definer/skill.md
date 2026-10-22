# Pipeline Stage Definer

Define pipeline stages with entry and exit criteria for each.

## Inputs

- `sales-process-description`: Description of the current sales motion
- `average-deal-size`: Typical deal value and sales cycle length

## Outputs

- `stage-definitions`: Named stages with entry and exit criteria
- `stage-probabilities`: Win probability assigned to each stage

## Process

1. List each pipeline stage from first contact to closed-won.
2. Define the entry criteria that move a deal into each stage.
3. Define the exit criteria that advance a deal to the next stage.
4. Assign a win probability percentage to each stage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
