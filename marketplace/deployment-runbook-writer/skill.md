# Deployment Runbook Writer

Produce the deployment runbook with rollback procedures.

## Inputs

- `rollout-plan`: The rollout stages and criteria
- `scaling-config`: Autoscaling configuration

## Outputs

- `deployment-runbook`: Complete deployment runbook
- `rollback-procedure`: Step-by-step rollback instructions

## Process

1. Document the full deployment procedure step by step.
2. Write the rollback procedure for each deployment stage.
3. Include monitoring dashboards and alert channels to watch.
4. Document the on-call escalation path for deployment issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
