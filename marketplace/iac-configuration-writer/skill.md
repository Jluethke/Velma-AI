# Iac Configuration Writer

Write the IaC configuration for each resource, organized into reusable modules.

## Inputs

- `resource-inventory`: Resources to write configurations for
- `module-structure`: Module and directory structure

## Outputs

- `iac-configurations`: Written IaC configuration files
- `variable-definitions`: Input variables for each module

## Process

1. Write configurations for networking resources first (VPC, subnets, security groups)
2. Write configurations for compute, storage, and database resources
3. Extract common patterns into reusable modules
4. Define input variables for environment-specific values

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
