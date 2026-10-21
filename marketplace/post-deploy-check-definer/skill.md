# Post Deploy Check Definer

Define post-deployment security checks that confirm the release is healthy and monitored.

## Inputs

- `deploy-time-checks`: Deployment-time checks
- `security-policy`: Security monitoring requirements

## Outputs

- `post-deploy-checks`: Post-deployment checks: smoke tests, monitoring alerts active, error rate baseline, WAF rules active
- `rollback-triggers`: Conditions that should trigger an automatic or manual rollback

## Process

1. List post-deployment checks: security smoke tests pass, monitoring dashboards and alerts are active.
2. Define the error rate and latency baselines that indicate a healthy deployment.
3. Define rollback triggers: what error rates or security findings require immediate rollback.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
