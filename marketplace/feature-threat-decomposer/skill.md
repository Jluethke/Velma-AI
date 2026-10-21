# Feature Threat Decomposer

Decompose a feature into components and data flows suitable for threat analysis.

## Inputs

- `feature-specification`: Description of the feature being developed
- `system-architecture`: Current system architecture and integration points

## Outputs

- `component-map`: Components, data flows, and trust boundaries for the feature
- `attack-surface`: Enumerated attack surface points where the feature accepts input or crosses trust boundaries

## Process

1. Break the feature into its constituent components (UI, API, data store, external services).
2. Draw the data flows between components and identify trust boundaries.
3. Enumerate the attack surface: every point where the feature accepts input or crosses a boundary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
