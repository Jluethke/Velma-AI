# Evidence Source Identification

Identify all relevant evidence sources for the incident.

## Inputs

- `incident-details`: Description of the incident and systems involved
- `affected-systems`: List of systems potentially containing evidence

## Outputs

- `evidence-source-list`: Prioritized list of all evidence sources to collect
- `collection-plan`: Plan for collecting evidence in priority order

## Process

1. Inventory all systems that may contain relevant evidence
2. Categorize evidence sources by volatility (memory > disk > network > logs)
3. Prioritize collection based on volatility (most volatile first)
4. Create a collection plan with responsible personnel for each source

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
