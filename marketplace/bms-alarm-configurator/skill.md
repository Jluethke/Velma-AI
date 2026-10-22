# Bms Alarm Configurator

Define the alarm and notification rules for the BMS.

## Inputs

- `schedule-config`: Control schedules
- `energy-monitoring-config`: Energy monitoring setup

## Outputs

- `alarm-rules`: Alarm definitions with priority, notification method, and escalation
- `bms-setup-document`: Complete BMS setup documentation

## Process

1. Define alarms for each system (temperature out of range, equipment failure, security breach, fire).
2. Assign priority levels (critical, high, medium, low) and notification methods (page, email, display).
3. Set escalation rules for unacknowledged alarms.
4. Compile the complete BMS setup documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
