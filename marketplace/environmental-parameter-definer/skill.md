# Environmental Parameter Definer

Define the monitoring parameters and sensor selection.

## Inputs

- `monitoring-area`: The area to monitor (building, campus, city block, farm)
- `parameters-of-interest`: What to measure (air quality, temperature, humidity, noise, light)

## Outputs

- `parameter-spec`: Specification for each parameter (range, precision, sampling rate)
- `sensor-selection`: Selected sensors with specifications and quantities

## Process

1. For each parameter, define the measurement range, required precision, and sampling frequency.
2. Select sensors that meet the specifications (accuracy, power, connectivity, weatherproofing).
3. Calculate the number of sensors needed based on the area and spatial resolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
