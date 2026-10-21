# Wind Tunnel Force Importer

Import raw force and moment balance data from the wind tunnel data acquisition system.

## Inputs

- `balance-data-files`: Multi-component balance output files with forces, moments, and freestream conditions
- `model-reference`: Reference area, length, and moment center coordinates

## Outputs

- `raw-forces-moments`: Six-component force and moment data at each test point
- `freestream-conditions`: Dynamic pressure, Mach number, Reynolds number, and angle of attack per point

## Process

1. Parse the data acquisition output and extract force, moment, and tunnel condition channels
2. Apply balance calibration matrix to convert raw voltages to engineering units
3. Associate each data point with its angle of attack and freestream conditions
4. Check for drift by comparing tare runs at the start and end of the test

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
