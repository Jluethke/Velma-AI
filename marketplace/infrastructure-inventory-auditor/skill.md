# Infrastructure Inventory Auditor

Inventory all existing infrastructure resources to be managed as code.

## Inputs

- `cloud-accounts`: Cloud provider accounts and access credentials
- `scope-definition`: Which resources are in scope for migration

## Outputs

- `resource-inventory`: Complete inventory of infrastructure resources
- `dependency-map`: Dependencies between resources

## Process

1. List all resources across compute, networking, storage, and databases
2. Map dependencies between resources
3. Identify resources that were created manually vs. those already in code
4. Categorize by migration priority and complexity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
