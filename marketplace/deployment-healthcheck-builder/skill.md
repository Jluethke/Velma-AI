# Deployment Healthcheck Builder

Implement health checks and automated rollback triggers for the deployment pipeline.

## Inputs

- `rollback-triggers`: Conditions that trigger rollback
- `strategy-parameters`: Configuration for the deployment strategy

## Outputs

- `healthcheck-config`: Health check endpoints and thresholds
- `automation-rules`: Automated rollback and promotion rules

## Process

1. Define health check endpoints and expected responses
2. Set the metrics thresholds for automatic rollback (error rate, latency)
3. Configure the promotion criteria for canary or blue-green cutover
4. Implement the automation in the deployment pipeline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
