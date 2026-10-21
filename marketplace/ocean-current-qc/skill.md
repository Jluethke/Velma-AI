# Ocean Current Qc

Quality-control raw ADCP or drifter current measurements by removing outliers, correcting for magnetic deviation, and flagging suspect data.

## Inputs

- `raw-current-data`: ADCP profiles or drifter positions and velocities with timestamps
- `magnetic-declination`: Local magnetic declination for compass correction

## Outputs

- `qc-current-data`: Quality-controlled current velocities with flags
- `qc-report`: Summary of data removed, flagged, and corrected

## Process

1. Apply magnetic declination correction to convert magnetic to true north
2. Remove data below the echo amplitude or correlation thresholds (ADCP) or fix obvious position jumps (drifters)
3. Flag outliers using speed thresholds and temporal consistency checks
4. Compute basic statistics (mean speed, direction, data return) for the quality-controlled dataset

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
