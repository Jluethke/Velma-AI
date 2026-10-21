# Threat Driven Requirement Deriver

Derive security requirements that counter each abuse case, with rationale tied back to the threat.

## Inputs

- `abuse-cases`: Attacker goals framed as negative use cases
- `trust-boundary-map`: Boundaries where trust level changes across the system

## Outputs

- `security-requirements`: Testable requirements that counter the abuse cases
- `requirement-rationale`: The threat each requirement answers and why

## Process

1. Map each abuse case to the control that would prevent or detect it
2. State each control as a testable requirement, not an implementation
3. Record the rationale linking the requirement to its abuse case
4. Flag abuse cases that no requirement yet addresses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
