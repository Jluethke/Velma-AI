# Soil Moisture Collector

Collect and interpret soil moisture data across the field.

## Inputs

- `field-zones`: Map of irrigation zones
- `sensor-readings`: Soil moisture sensor data or manual readings

## Outputs

- `moisture-profile`: Soil moisture levels by zone and depth
- `deficit-zones`: Zones below the target moisture threshold

## Process

1. Read soil moisture data from sensors or manual sampling.
2. Map moisture levels to irrigation zones.
3. Identify zones below the refill threshold.
4. Flag deficit zones for priority scheduling.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
