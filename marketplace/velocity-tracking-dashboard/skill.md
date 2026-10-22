# Velocity Tracking Dashboard

Set up ongoing tracking of deal velocity so you can detect new bottlenecks as the pipeline evolves.

## Inputs

- `intervention`: The change implemented
- `stage-times`: The baseline measurements

## Outputs

- `velocity-dashboard`: A dashboard showing: average time per stage (current vs baseline), total cycle time trend, and the current bottleneck stage
- `review-cadence`: Monthly review of velocity metrics to detect new bottlenecks

## Process

1. Build a monthly dashboard that tracks average days in each stage. Compare to the baseline established before the intervention.
2. Flag any stage where average time increases by more than 20% from baseline. This indicates a new or returning bottleneck.
3. Track total cycle time as a single metric. The goal is to reduce total cycle time while maintaining or improving win rate. Faster deals that lose more often are not an improvement.
4. Review monthly. As you fix one bottleneck, another stage will become the new slowest. This is expected. The cycle of identify-diagnose-intervene continues until total cycle time reaches an acceptable level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
