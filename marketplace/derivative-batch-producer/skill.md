# Derivative Batch Producer

Produce the derivative content in batches from the pillar content.

## Inputs

- `derivative-specs`: The specs for each derivative format
- `production-workflow`: The production steps for each format

## Outputs

- `derivative-content-batch`: The produced derivative content files ready for scheduling
- `batch-manifest`: Inventory of all derivatives with their target platforms and publish dates

## Process

1. Extract the source segments from the pillar content for each derivative.
2. Produce each derivative following the format workflow.
3. Write the captions and metadata for each derivative.
4. Organize the batch with platform assignments and scheduled dates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
