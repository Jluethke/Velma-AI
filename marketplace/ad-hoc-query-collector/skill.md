# Ad Hoc Query Collector

Inventory the most common ad-hoc SQL queries across the team.

## Inputs

- `analyst-team`: List of analysts who write SQL queries
- `database-catalog`: Available databases and their schemas

## Outputs

- `query-inventory`: Collection of commonly written queries with frequency and purpose
- `duplication-map`: Queries that multiple people write for the same purpose

## Process

1. Collect the most frequently run queries from each analyst.
2. Categorize by purpose: revenue, usage, retention, operations, support.
3. Identify duplicates where multiple people wrote the same query differently.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
