# Iac State Importer

Import existing infrastructure state into the IaC tool without disrupting running resources.

## Inputs

- `iac-configurations`: Written IaC configuration files
- `dependency-map`: Dependencies between resources

## Outputs

- `imported-state`: IaC state file with imported resources
- `import-log`: Log of imported resources and any issues

## Process

1. Import resources in dependency order (dependencies before dependents)
2. Run a plan after each import to verify no changes are proposed
3. Resolve any drift between the configuration and actual state
4. Log each import and any manual adjustments required

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
