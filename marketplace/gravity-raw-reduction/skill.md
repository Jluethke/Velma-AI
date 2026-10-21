# Gravity Raw Reduction

Apply instrument drift, tidal, latitude, and elevation corrections to raw gravity readings to produce reduced gravity values.

## Inputs

- `raw-gravity-readings`: Station-by-station gravity meter readings with timestamps and coordinates
- `base-station-ties`: Repeated base station readings for drift correction
- `station-elevations`: Surveyed elevations and coordinates for each station

## Outputs

- `reduced-gravity-values`: Gravity values corrected for drift, tides, latitude, and free-air effect
- `reduction-log`: Record of each correction applied and its magnitude

## Process

1. Compute instrument drift from base station repeats and apply a linear or polynomial correction
2. Remove tidal gravity variations using a tide prediction model for the survey dates and location
3. Apply latitude correction (normal gravity formula) and free-air correction using surveyed elevations
4. Tabulate the corrected values with station IDs and coordinates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
