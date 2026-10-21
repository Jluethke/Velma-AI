# Water Quality Sampler

Measure and record water quality parameters including temperature, salinity, dissolved oxygen, pH, turbidity, and nutrient concentrations.

## Inputs

- `sampling-schedule`: Planned sampling locations, depths, and times
- `instrument-list`: Available sensors and sample collection equipment (CTD, Niskin bottles, probes)
- `parameter-targets`: Which water quality parameters to measure and at what precision

## Outputs

- `water-quality-data`: Tabulated measurements with location, depth, time, and instrument calibration status
- `nutrient-samples`: Preserved water samples labeled for lab analysis of nitrate, phosphate, and chlorophyll
- `calibration-log`: Pre- and post-measurement calibration records for each instrument

## Process

1. Calibrate all field instruments against certified standards before deployment
2. Deploy CTD or multiparameter sonde at each sampling station through the water column
3. Collect discrete water samples at target depths using Niskin bottles or equivalent
4. Preserve nutrient and chlorophyll samples on ice for laboratory analysis
5. Record all measurements with metadata (time, GPS, depth, sea state, weather conditions)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
