# Integration Point Mapper

Map all integration points between systems.

## Inputs

- `system-architecture`: How the systems connect to each other
- `api-contracts`: API specifications for each integration

## Outputs

- `integration-map`: Every integration point with source, target, protocol, and data flow
- `test-priority-ranking`: Integrations ranked by business criticality and failure risk

## Process

1. List every system-to-system connection.
2. For each connection, document the protocol (REST, GraphQL, message queue, file transfer).
3. Map the data flow: what data moves, in what format, how often.
4. Rank by priority: high-traffic and high-impact integrations first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
