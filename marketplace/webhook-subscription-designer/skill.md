# Webhook Subscription Designer

Design the subscription management system for webhook consumers.

## Inputs

- `event-catalog`: The events available for subscription
- `consumer-needs`: How consumers will subscribe and filter

## Outputs

- `subscription-api`: API design for creating, listing, updating, and deleting webhook subscriptions
- `filtering-rules`: How consumers can filter which events they receive (event types, resource IDs, conditions)

## Process

1. Design the subscription endpoint: POST /webhooks with target URL, event types, optional filters.
2. Design the verification flow: send a challenge to the target URL and require a correct response before activating.
3. Design the filtering mechanism: subscribe to specific event types, specific resources, or conditions.
4. Design the management endpoints: list subscriptions, update filters, pause, delete.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
