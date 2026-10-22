# Initial Notification Sender

Send the initial incident notification to the determined audience.

## Inputs

- `severity-level`: Assigned severity level
- `notification-audience`: Stakeholder groups to notify

## Outputs

- `initial-notification`: The initial notification message sent to stakeholders
- `delivery-confirmation`: Confirmation that the notification reached each channel

## Process

1. Draft the initial notification: what is affected, what the current impact is, who is investigating, when the next update will be.
2. Send to each audience group on their designated channel (engineering: Slack; leadership: email + Slack; customers: status page).
3. Confirm delivery on each channel.
4. Set the timer for the next update based on severity (SEV1: every 15 minutes; SEV2: every 30 minutes).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
