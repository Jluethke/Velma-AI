# Architecture Decision Documenter

Document all security architecture decisions, trade-offs, and residual risks.

## Inputs

- `control-matrix`: Selected controls and their zones
- `control-rationale`: Justification for each control
- `network-architecture`: Network design diagram

## Outputs

- `architecture-decisions`: Architecture decision records (ADRs) for each security choice
- `residual-risk-register`: Risks accepted after control implementation

## Process

1. Write an ADR for each significant security decision (format: context, decision, consequences)
2. Document trade-offs between security, usability, cost, and performance
3. List residual risks with their accepted probability and impact
4. Note any compensating controls for accepted risks

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
