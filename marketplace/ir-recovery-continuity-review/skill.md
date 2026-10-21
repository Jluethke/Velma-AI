# Ir Recovery Continuity Review

Review recovery procedures and business continuity plans for restoring operations after the incident.

## Inputs

- `containment-assessment`: Containment effectiveness assessment
- `scenario-document`: Scenario with recovery phase injects

## Outputs

- `recovery-assessment`: Assessment of recovery procedure adequacy and timeline
- `continuity-gaps`: Gaps in business continuity during recovery

## Process

1. Walk through system restoration from backups, validating backup integrity
2. Assess how long each critical service would be down
3. Test failover and alternate operation procedures
4. Check evidence preservation during recovery (forensic images before rebuilding)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
