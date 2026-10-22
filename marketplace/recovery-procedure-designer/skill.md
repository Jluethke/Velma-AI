# Recovery Procedure Designer

Design the recovery procedures for each critical service.

## Inputs

- `recovery-objectives`: RTO and RPO targets
- `recovery-tiers`: Recovery priority tiers
- `dependency-map`: Service dependencies

## Outputs

- `recovery-procedures`: Step-by-step recovery procedures per service
- `resource-requirements`: People, infrastructure, and data needed for recovery

## Process

1. Design the recovery steps for each service in dependency order.
2. Identify the personnel, infrastructure, and data backups required.
3. Document the communication plan during recovery.
4. Define the criteria for declaring the service recovered.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
