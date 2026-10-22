# Logging Protocol Writer

Establish the protocol for when and how to log decisions.

## Inputs

- `decision-schema`: The log entry schema
- `storage-format`: Where the log lives

## Outputs

- `logging-protocol`: Rules for when to log, who logs, and how
- `trigger-checklist`: List of events that trigger a log entry

## Process

1. Define which decisions require logging (threshold: cost, reversibility, team impact).
2. Assign responsibility for logging (decision maker, delegate, or automated).
3. Set the timing (log before execution, within 24 hours, at next standup).
4. Produce the protocol document and trigger checklist.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
