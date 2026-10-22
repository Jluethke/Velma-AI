# Iac Cicd Setup

Set up CI/CD for infrastructure changes with automated plan, approval gates, and apply.

## Inputs

- `validation-results`: Staging validation results
- `selected-iac-tool`: The IaC tool in use

## Outputs

- `iac-pipeline`: CI/CD pipeline for infrastructure changes
- `iac-migration-report`: Complete IaC migration report

## Process

1. Configure the CI pipeline to run plan on pull requests
2. Add approval gates before apply to production
3. Set up state locking to prevent concurrent modifications
4. Compile the IaC migration report with the final state

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
