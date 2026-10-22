# Maintenance Trade Dispatch

Dispatch the appropriate trade professional to the property.

## Inputs

- `triaged-request`: Classified request with trade and priority
- `authorization-status`: Approval status for the repair

## Outputs

- `dispatch-record`: Dispatched technician with ETA and job details
- `tenant-notification`: Notification sent to the tenant with technician details and ETA

## Process

1. Select from the internal crew or approved subcontractor list by trade.
2. Confirm availability and dispatch with the job details.
3. Notify the tenant with the technician name, ETA, and access instructions.
4. Escalate if no technician is available within the SLA window.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
