# Api Key Lifecycle Designer

Design the key lifecycle: creation, rotation, and revocation.

## Inputs

- `key-policy`: The key policy
- `key-format-spec`: The key format

## Outputs

- `lifecycle-flows`: Flows for key creation, rotation (with overlap period), and revocation
- `audit-trail-spec`: What key events to log (created, used, rotated, revoked, expired) and the log format

## Process

1. Design key creation: generate, show once, store hashed.
2. Design key rotation: create new key, overlap period where both work, deactivate old key.
3. Design key revocation: immediate disable, grace period option, notification to key owner.
4. Design the audit trail: log every key event with timestamp, actor, IP, and key prefix (never the full key).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
