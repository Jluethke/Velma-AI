# Bms Platform Integrator

Integrate the building systems into the BMS platform.

## Inputs

- `systems-inventory`: Building systems inventory
- `integration-requirements`: Protocol and connectivity requirements

## Outputs

- `integration-status`: Status of each system's integration (connected, partial, pending)
- `point-list`: Complete list of data points available in the BMS

## Process

1. Connect each system to the BMS platform using the appropriate protocol driver.
2. Verify each data point is reading correctly (temperatures, status, setpoints, alarms).
3. Document any systems that could not be integrated and the workaround plan.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
