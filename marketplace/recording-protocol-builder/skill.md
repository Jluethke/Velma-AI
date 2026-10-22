# Recording Protocol Builder

Set up the recording protocol for ledger entries.

## Inputs

- `event-taxonomy`: Event types and severities
- `severity-definitions`: Severity level definitions

## Outputs

- `recording-protocol`: Rules for recording events (timestamp, type, description, actor, impact)
- `entry-template`: Template for a ledger entry

## Process

1. Define the required fields per entry (timestamp, event type, severity, description, actor, impact, resolution).
2. Set the recording timing (real-time for critical, batch for informational).
3. Create the entry template.
4. Document the recording protocol.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
