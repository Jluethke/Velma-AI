# Webhook Registration Designer

Design the webhook subscription and registration API.

## Inputs

- `event-catalog`: Available events and their payloads
- `event-groupings`: How events are grouped

## Outputs

- `registration-api-spec`: API endpoints for creating, updating, listing, and deleting webhook subscriptions
- `security-spec`: Signature verification, secret rotation, and authentication for webhook delivery

## Process

1. Design CRUD endpoints for webhook subscriptions (create, read, update, delete, list).
2. Define the subscription fields: URL, events, secret, active/inactive status.
3. Design the signature scheme (HMAC-SHA256 with shared secret).
4. Add a test endpoint that sends a sample event to verify the consumer URL.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
