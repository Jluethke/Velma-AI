# Hunt Data Source Planner

Define the data sources, queries, and tools needed to test the hunting hypothesis.

## Inputs

- `hunt-hypothesis`: The hypothesis to test
- `attack-technique-profile`: Expected artifacts and data sources for the technique

## Outputs

- `hunt-plan`: Detailed plan with data sources, queries, and analysis procedures
- `query-library`: Collection of queries for each data source to execute during the hunt

## Process

1. Map the technique artifacts to available log sources (endpoint, network, identity, cloud)
2. Write queries for each data source to surface the expected behavior patterns
3. Define the analysis workflow: what to look for in query results and how to pivot

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
