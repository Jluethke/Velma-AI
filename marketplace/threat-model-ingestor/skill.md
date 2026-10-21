# Threat Model Ingestor

Ingest the threat model and architecture into a threat inventory and attack surface map for test planning.

## Inputs

- `threat-model`: Existing threat model with threats and assumptions
- `system-architecture`: Components, interfaces, and data flows of the system

## Outputs

- `threat-inventory`: Normalized list of threats with affected assets
- `attack-surface-map`: Entry points and interfaces exposed to attackers

## Process

1. Normalize threats from the model into a consistent inventory
2. Map each threat to the components and interfaces it targets
3. Enumerate entry points to form the attack surface map
4. Flag threats with no corresponding entry point for review

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
