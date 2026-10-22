# Rollback Procedure Designer

Design the rollback procedure including triggers, steps, and database migration reversal.

## Inputs

- `selected-strategy`: The chosen deployment strategy
- `architecture-constraints`: Architecture constraints

## Outputs

- `rollback-procedure`: Step-by-step rollback procedure
- `rollback-triggers`: Conditions that trigger an automatic rollback

## Process

1. Define the manual rollback steps for each component
2. Address database schema rollback or forward-compatible migration
3. Define the criteria that trigger an automatic rollback
4. Set the maximum rollback time and test it

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
