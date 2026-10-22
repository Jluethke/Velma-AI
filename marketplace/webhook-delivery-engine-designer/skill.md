# Webhook Delivery Engine Designer

Design the delivery engine with retry logic and security.

## Inputs

- `subscription-api`: The subscription model
- `event-catalog`: The events to deliver

## Outputs

- `delivery-spec`: Delivery specification: timeout, retry schedule, failure handling, signing method
- `security-spec`: Webhook security specification (HMAC signing, timestamp validation, IP allowlisting)

## Process

1. Set the delivery timeout (5 to 30 seconds, depending on the consumer).
2. Design the retry schedule: exponential backoff (30s, 5m, 30m, 2h, 12h) with max attempts.
3. Design the HMAC signature: include the signing secret, sign the raw payload, send the signature in a header.
4. Design the failure handling: disable the subscription after N consecutive failures, notify the owner.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
