# Repair Status Updater

Send status updates during the repair to keep the customer informed.

## Inputs

- `update-sent`: Prior communication for context
- `authorization-request`: Customer authorization record

## Outputs

- `status-updates-log`: Record of all status updates sent during the repair
- `ready-notification`: Notification sent when the vehicle is ready for pickup

## Process

1. Send an update if the repair will take longer than expected or if additional work is found.
2. Notify the customer when parts arrive if there was a wait.
3. Send the vehicle-ready notification with the final total and pickup instructions.
4. Log all updates sent during the repair.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
