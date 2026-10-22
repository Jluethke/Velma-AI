# Alert Category Definition

Define the alert categories and their severity levels for the organization.

## Inputs

- `systems-inventory`: List of systems and services that produce alerts
- `team-structure`: Teams and roles responsible for responding to alerts

## Outputs

- `alert-categories`: Defined categories (critical, warning, informational) with criteria for each
- `severity-matrix`: Matrix mapping alert types to severity levels

## Process

1. List every system and service that produces alerts, grouped by function.
2. Define three to five severity levels with clear criteria for each (impact scope, urgency, customer visibility).
3. Assign each alert type from the systems inventory to a severity level.
4. Document the severity matrix with examples for each level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
