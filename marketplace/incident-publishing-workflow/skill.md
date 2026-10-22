# Incident Publishing Workflow

Publish and manage incidents on the status page during an outage.

## Inputs

- `incident-templates`: Communication templates
- `communication-guidelines`: Guidelines for updates

## Outputs

- `published-incident-log`: Log of all published incidents and updates
- `subscriber-notification-record`: Record of notifications sent to status page subscribers

## Process

1. When an incident is declared, post the initial notice using the template and set affected components to the correct status.
2. Post updates at the interval defined in the guidelines (every 30 minutes minimum).
3. When the incident is resolved, post the resolution notice and return components to operational.
4. Review the subscriber notification delivery to confirm all subscribers received the updates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
