# Checklist Automation Builder

Automate checklist enforcement in the CI/CD pipeline so deployments cannot proceed with failing checks.

## Inputs

- `pre-deploy-checks`: Pre-deployment checks
- `deploy-verification-scripts`: Deployment-time verification scripts

## Outputs

- `automated-checklist`: Pipeline configuration enforcing all checks with gates
- `exception-process`: Process for requesting and approving exceptions to checklist items

## Process

1. Integrate pre-deployment checks as pipeline gates that block progression.
2. Add deployment-time verification as a post-deploy pipeline step with rollback on failure.
3. Define the exception process for time-sensitive releases that need a check waived with approval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
