# Threat Derived Requirements

Derive security requirements from the system's threat model.

## Inputs

- `data-flow-diagrams`: Diagrams showing how data moves through the system
- `applicable-regulations`: List of regulations that apply

## Outputs

- `threat-requirements`: Security requirements derived from each identified threat
- `threat-risk-rankings`: Threats ranked by likelihood and impact

## Process

1. Identify trust boundaries and potential threat agents from the data flow diagrams.
2. Apply STRIDE to each component to enumerate threats.
3. Translate each threat into a security requirement with a testable acceptance criterion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
