# System Context Analyzer

Analyze the system context, data sensitivity, and trust boundaries that scope security requirements.

## Inputs

- `system-description`: What the system does, its users, and its interfaces
- `data-sensitivity-profile`: Classification of the data the system handles

## Outputs

- `system-context-model`: Actors, assets, and data flows in scope
- `trust-boundary-map`: Boundaries where trust level changes across the system

## Process

1. List actors, external systems, and the assets each one touches
2. Trace data flows and mark where data crosses a trust boundary
3. Classify each asset by sensitivity and regulatory obligation
4. Record assumptions about the deployment and threat environment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
