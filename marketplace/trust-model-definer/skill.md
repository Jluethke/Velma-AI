# Trust Model Definer

Define the trust model, security zones, and trust boundaries for the system architecture.

## Inputs

- `security-requirements`: Requirements from stakeholder gathering
- `data-classification`: Data sensitivity levels

## Outputs

- `trust-model`: Trust zones, boundaries, and the trust level assigned to each component
- `data-flow-diagram`: Data flows crossing trust boundaries with sensitivity annotations

## Process

1. Identify trust zones (public internet, DMZ, internal network, restricted enclave)
2. Map each component to its trust zone
3. Trace data flows across trust boundaries
4. Document the trust assumptions for each boundary crossing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
