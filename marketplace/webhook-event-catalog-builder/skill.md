# Webhook Event Catalog Builder

Define the events that trigger webhooks and their payload schemas.

## Inputs

- `system-events`: List of events the system produces
- `consumer-needs`: What external systems need to know about

## Outputs

- `event-catalog`: Each webhook event with name, trigger condition, and payload schema
- `event-groupings`: Events grouped by resource for subscription management

## Process

1. List every event the system produces that external consumers would use.
2. Define the payload schema for each event: what fields, what format, what identifiers.
3. Group events by resource (e.g., order.created, order.updated, order.cancelled).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
