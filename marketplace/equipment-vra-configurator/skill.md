# Equipment Vra Configurator

Configure equipment for variable-rate input application.

## Inputs

- `vra-maps`: Prescription map files
- `equipment-specs`: Controller type, planter or spreader model

## Outputs

- `equipment-config`: Controller settings and file transfer instructions
- `calibration-record`: Calibration checks performed before application

## Process

1. Load prescription files onto the equipment controller.
2. Set the controller to variable-rate mode and verify file compatibility.
3. Calibrate the applicator (seed drop, fertilizer rate, lime spread).
4. Run a test pass and verify actual vs prescribed rates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
