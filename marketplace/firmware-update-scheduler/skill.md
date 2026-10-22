# Firmware Update Scheduler

Schedule and deploy firmware updates to the fleet.

## Inputs

- `fleet-inventory`: The device inventory
- `inventory-gaps`: Devices with data issues

## Outputs

- `update-schedule`: The firmware rollout schedule (which devices, when, in what order)
- `rollback-plan`: Plan for rolling back failed updates

## Process

1. Identify devices running outdated firmware.
2. Group devices into rollout waves (canary, early adopter, general).
3. Schedule each wave with a monitoring window between waves.
4. Define the rollback criteria and procedure for each wave.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
