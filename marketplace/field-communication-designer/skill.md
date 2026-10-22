# Field Communication Designer

Design the communication protocol between dispatch and field crews.

## Inputs

- `dispatch-rules`: Dispatch rules
- `escalation-rules`: Escalation rules

## Outputs

- `communication-protocol`: How dispatch communicates with field crews (channels, formats, frequency)
- `status-update-rules`: Required status updates from field crews (en route, on site, completed)

## Process

1. Select the communication channels (mobile app, radio, SMS, phone).
2. Define the job dispatch message format (job ID, address, description, priority, customer contact).
3. Set the required status updates (acknowledged, en route, on site, work started, completed).
4. Design the feedback loop for crews to report issues or request support.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
