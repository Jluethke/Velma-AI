# Abuse Case Developer

Develop abuse cases and misuse scenarios that describe how an attacker subverts each trust boundary.

## Inputs

- `system-context-model`: Actors, assets, and data flows in scope
- `trust-boundary-map`: Boundaries where trust level changes across the system

## Outputs

- `abuse-cases`: Attacker goals framed as negative use cases
- `misuse-scenarios`: Step-by-step scenarios of abuse across boundaries

## Process

1. For each trust boundary, name the attacker goal that violates it
2. Write the abuse case as a negative counterpart to a normal use case
3. Describe the misuse scenario as concrete attacker steps
4. Tag each scenario with the asset and boundary it targets

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
