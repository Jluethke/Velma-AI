# Iac Staging Validator

Validate the IaC configurations by running plan and apply in a staging environment.

## Inputs

- `iac-configurations`: IaC configuration files
- `imported-state`: State file with imported resources

## Outputs

- `validation-results`: Results of plan and apply in staging
- `drift-report`: Any configuration drift detected

## Process

1. Run a plan against the staging environment
2. Verify no unexpected changes are proposed
3. Apply the configuration to staging and verify resources
4. Document any drift and resolve it in the configuration

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
