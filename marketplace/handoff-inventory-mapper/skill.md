# Handoff Inventory Mapper

Map every handoff in the process. A handoff occurs whenever work passes from one person, team, system, or shift to another. Most processes have more handoffs than people realize.

## Inputs

- `process-name`: The process to analyze for handoff failures
- `failure-examples`: Recent examples of things falling through the cracks (optional but speeds diagnosis)

## Outputs

- `handoff-map`: List of every handoff: sender, receiver, what is handed off, and the current method
- `failure-prone-handoffs`: Handoffs where failures have occurred or are likely, based on the examples provided

## Process

1. Walk the process from start to finish. Mark every point where the responsible party changes.
2. Include handoffs to systems (data entry, file uploads) and from systems (automated notifications, queue assignments).
3. For each handoff, note the current method: verbal, email, ticket, shared document, queue, physical object.
4. If failure examples were provided, map each failure to the handoff where it occurred.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
