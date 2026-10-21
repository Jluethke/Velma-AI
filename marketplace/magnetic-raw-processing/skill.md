# Magnetic Raw Processing

Apply diurnal correction and remove the International Geomagnetic Reference Field (IGRF) from raw total-field magnetic readings.

## Inputs

- `raw-magnetic-readings`: Total-field magnetometer readings with timestamps and coordinates
- `base-station-magnetogram`: Continuous base station magnetic record for diurnal correction

## Outputs

- `corrected-magnetic-anomaly`: Magnetic anomaly after diurnal and IGRF removal
- `processing-log`: Record of corrections applied

## Process

1. Subtract diurnal variations using the base station magnetogram aligned to survey timestamps
2. Remove the IGRF reference field for the survey date and location
3. Flag and handle any despiking needed for cultural noise or instrument glitches
4. Grid the anomaly values for mapping

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
