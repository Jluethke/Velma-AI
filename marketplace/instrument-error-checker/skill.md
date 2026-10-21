# Instrument Error Checker

Check whether the anomaly could be explained by instrument malfunction, calibration drift, or sensor saturation.

## Inputs

- `anomaly-profile`: Quantitative characterization of the anomaly
- `instrument-metadata`: Sensor specifications, calibration logs, known failure modes

## Outputs

- `instrument-verdict`: Whether instrument error can or cannot explain the anomaly
- `instrument-evidence`: Supporting evidence for the verdict

## Process

1. Review calibration logs and maintenance records for the time window.
2. Check whether the anomaly falls outside the instrument's linear range or resolution.
3. Compare against known instrument failure signatures (dropout, saturation, aliasing).
4. Issue a verdict: instrument error ruled out, plausible, or confirmed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
