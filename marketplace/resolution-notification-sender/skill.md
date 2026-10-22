# Resolution Notification Sender

Send the resolution notification and produce the notification record.

## Inputs

- `update-log`: Log of all updates sent
- `stakeholder-questions`: Stakeholder questions from the incident

## Outputs

- `resolution-notice`: The resolution notification sent to all stakeholders
- `incident-notification-record`: Complete record of all notifications sent during this incident

## Process

1. Draft the resolution notice: what was affected, what the root cause was, what fixed it, whether any follow-up is needed.
2. Send to all channels and confirm delivery.
3. Answer any outstanding stakeholder questions.
4. Compile the full notification record (initial, updates, resolution) with timestamps and delivery confirmations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
