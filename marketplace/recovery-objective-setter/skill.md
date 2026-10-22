# Recovery Objective Setter

Define recovery time and recovery point objectives.

## Inputs

- `critical-services`: Ranked critical services
- `dependency-map`: Service dependencies

## Outputs

- `recovery-objectives`: RTO and RPO for each critical service
- `recovery-tiers`: Services grouped by recovery priority tier

## Process

1. Set the RTO (maximum acceptable downtime) for each service.
2. Set the RPO (maximum acceptable data loss) for each service.
3. Group services into recovery tiers by priority.
4. Validate objectives are achievable with current infrastructure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
