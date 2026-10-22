# Sensor Schema Designer

Define the data schema for sensor telemetry.

## Inputs

- `sensor-types`: The types of sensors and their measurements
- `data-requirements`: What the data will be used for

## Outputs

- `data-schema`: The schema definition (sensor ID, timestamp, value, unit, metadata)
- `validation-rules`: Rules for data validation (ranges, types, required fields)

## Process

1. List each sensor type and the measurements it produces.
2. Define the fields for each telemetry record (sensor ID, timestamp, value, unit).
3. Set the validation rules for each field (data type, allowed range, required vs optional).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
