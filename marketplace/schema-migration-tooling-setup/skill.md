# Schema Migration Tooling Setup

Implement schema migration tooling for safe, versioned database schema changes.

## Inputs

- `database-inventory`: Databases requiring migration tooling
- `replication-config`: Replication setup for migration considerations

## Outputs

- `migration-tooling`: Configured schema migration tool
- `migration-workflow`: Workflow for applying schema changes safely

## Process

1. Select the migration tool (Flyway, Liquibase, Alembic, golang-migrate)
2. Set up the migration directory and naming conventions
3. Define the workflow for creating, reviewing, and applying migrations
4. Implement safeguards (backward-compatible changes, online DDL)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
