# Query Performance Optimizer

Configure connection pooling and optimize query performance for the database workload.

## Inputs

- `database-inventory`: Databases to optimize
- `risk-findings`: Known performance risks

## Outputs

- `pooling-config`: Connection pooling configuration
- `query-optimizations`: Applied query and index optimizations

## Process

1. Configure connection pooling (PgBouncer, ProxySQL, or built-in)
2. Identify slow queries from the slow query log
3. Add or adjust indexes for the heaviest queries
4. Verify performance improvement with before and after metrics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
