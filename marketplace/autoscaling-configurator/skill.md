# Autoscaling Configurator

Configure autoscaling for the serving infrastructure.

## Inputs

- `infrastructure-config`: Current infrastructure setup
- `traffic-estimates`: Expected traffic patterns and peaks

## Outputs

- `scaling-config`: Autoscaling rules and thresholds
- `cost-estimate`: Estimated infrastructure cost at different traffic levels

## Process

1. Define scaling metrics (CPU, memory, request queue depth, latency).
2. Set minimum and maximum replica counts.
3. Configure scale-up and scale-down thresholds and cooldown periods.
4. Estimate costs at expected and peak traffic levels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
