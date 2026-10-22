# Bms Schedule Configurator

Configure the control schedules and setpoints in the BMS.

## Inputs

- `integration-status`: System integration status
- `point-list`: Available data points

## Outputs

- `schedule-config`: HVAC, lighting, and access schedules by zone and day
- `energy-monitoring-config`: Energy monitoring configuration (meters, dashboards, targets)

## Process

1. Set the HVAC schedules by zone (occupied hours, setback hours, weekend, holiday).
2. Set the lighting schedules by zone (auto-on/off, daylight harvesting, occupancy).
3. Configure energy monitoring by meter and set baseline targets.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
