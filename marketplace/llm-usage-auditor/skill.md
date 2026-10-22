# Llm Usage Auditor

Audit current LLM usage by model, endpoint, and cost.

## Inputs

- `billing-data`: LLM API billing and usage records
- `application-list`: Applications that use LLM APIs

## Outputs

- `usage-breakdown`: Usage by model, application, and cost center
- `cost-hotspots`: Highest-cost applications and queries

## Process

1. Collect billing data by model and endpoint.
2. Map usage to applications and teams.
3. Identify the top cost drivers.
4. Calculate the cost per query for each application.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
