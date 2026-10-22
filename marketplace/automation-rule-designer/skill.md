# Automation Rule Designer

Define the automation rules for schedules, triggers, and conditions.

## Inputs

- `device-inventory`: List of devices by room
- `integration-map`: Device compatibility map

## Outputs

- `automation-rules`: The defined automation rules (trigger, condition, action)
- `scene-definitions`: Scene configurations (away, sleep, morning, movie)

## Process

1. Define time-based automations (lights on at sunset, thermostat schedule, morning routine).
2. Define event-based automations (motion triggers lights, door lock triggers camera).
3. Design the scenes as named groups of device states (away mode, bedtime, good morning).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
