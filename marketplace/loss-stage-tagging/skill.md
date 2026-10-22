# Loss Stage Tagging

Tag each loss by the pipeline stage where it actually stalled or died, not the stage it was sitting in when marked lost.

## Inputs

- `lost-deal-list`: Clean list of lost deals
- `loss-metadata`: Per-deal metadata

## Outputs

- `stage-tagged-losses`: Losses tagged with the stage where momentum stopped
- `stage-distribution`: Count of losses at each stage, showing where deals die most

## Process

1. For each deal, read the activity trail backward to find the last stage where the buyer was still moving forward.
2. Tag the loss to that stage, since a deal marked lost at proposal may have truly died at discovery.
3. Count losses per stage and write the distribution.
4. Flag any stage that holds a large share of losses as a candidate problem area to examine in later steps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
