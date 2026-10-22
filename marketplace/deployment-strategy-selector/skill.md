# Deployment Strategy Selector

Select the deployment strategy based on risk assessment, architecture, and operational requirements.

## Inputs

- `risk-assessment`: Deployment risk factors
- `architecture-constraints`: Architecture constraints on deployment

## Outputs

- `selected-strategy`: The chosen deployment strategy with rationale
- `strategy-parameters`: Configuration parameters for the strategy

## Process

1. Evaluate blue-green, canary, rolling, and feature flag strategies
2. Match each strategy against the risk assessment and constraints
3. Select the strategy that best fits the requirements
4. Define the configuration parameters (canary percentage, rollout rate)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
