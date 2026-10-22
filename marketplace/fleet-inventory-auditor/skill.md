# Fleet Inventory Auditor

Inventory all vehicles in the fleet and their current status.

## Inputs

- `fleet-roster`: List of all vehicles in the fleet
- `maintenance-history`: Historical maintenance records for each vehicle

## Outputs

- `fleet-inventory`: Current inventory with status, mileage, and condition
- `aging-report`: Vehicle age and remaining useful life estimates

## Process

1. Record the current mileage, condition, and assignment of each vehicle
2. Review maintenance history for recurring issues
3. Estimate remaining useful life based on age and mileage
4. Produce the fleet inventory and aging report

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
