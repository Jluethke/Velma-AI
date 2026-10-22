# Device Health Monitor

Monitor device health across the fleet.

## Inputs

- `fleet-inventory`: The device inventory
- `update-schedule`: Firmware rollout schedule

## Outputs

- `health-report`: Fleet health summary (connectivity, battery, uptime by device group)
- `action-items`: Devices requiring intervention (offline, low battery, errors)

## Process

1. Collect health metrics from the management platform (last seen, battery level, error count, uptime).
2. Aggregate metrics by device type, location, and firmware version.
3. Identify devices that need intervention and categorize by urgency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
