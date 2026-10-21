# Pre Deploy Check Definer

Define pre-deployment security checks that must pass before any release.

## Inputs

- `release-process`: Current release process and CI/CD pipeline configuration
- `security-policy`: Organizational security policy and compliance requirements

## Outputs

- `pre-deploy-checks`: List of pre-deployment checks: vulnerability scan results, code review sign-off, secrets not in code, dependency audit
- `check-ownership`: Owner and approver for each check

## Process

1. List all security checks that must complete before deployment: scan results, review approvals, license compliance.
2. Define the pass/fail criteria for each check.
3. Assign an owner and approver for each check.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
