# Webhook Event Definer

Define the events that trigger webhooks and their payload structure.

## Inputs

- `system-events`: List of events the system produces that external consumers might need
- `consumer-needs`: What integrators need to react to

## Outputs

- `event-catalog`: Catalog of webhook events with name, description, trigger condition, and payload schema
- `payload-schemas`: JSON schema for each event's payload

## Process

1. List every event that could trigger a webhook (resource created, updated, deleted, state changes, threshold crossings).
2. For each event, define the name (resource.action format: order.created, payment.failed), description, and trigger condition.
3. Design the payload schema for each event: include the event type, timestamp, resource data, and any relevant metadata.
4. Define the common envelope (event ID, event type, timestamp, API version) that wraps every payload.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
