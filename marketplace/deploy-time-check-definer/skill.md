# Deploy Time Check Definer

Define deployment-time security checks that verify the infrastructure configuration during deployment.

## Inputs

- `pre-deploy-checks`: Pre-deployment checks
- `release-process`: Current release process

## Outputs

- `deploy-time-checks`: Checks during deployment: TLS config, security headers, access controls, secrets injection
- `deploy-verification-scripts`: Automated scripts to verify each deployment-time check

## Process

1. List infrastructure checks: TLS certificate validity, security headers present, CORS configured correctly.
2. Add access control checks: service accounts have least privilege, network policies enforced.
3. Write verification scripts for each check that can run during deployment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
