# Traffic Splitting Setup

Set up A/B traffic splitting for safe model rollout.

## Inputs

- `validated-endpoint`: The validated serving endpoint
- `rollout-strategy`: How to roll out the new model (canary, blue-green, shadow)

## Outputs

- `traffic-config`: Traffic splitting configuration
- `rollout-plan`: Step-by-step rollout plan with checkpoints

## Process

1. Configure the traffic split between the current and new model versions.
2. Define the rollout stages (1%, 10%, 50%, 100%) with success criteria at each.
3. Set up comparison metrics between model versions.
4. Define the automatic rollback trigger conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
