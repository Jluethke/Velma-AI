# Detection Measurement

Measure mean time to detection and identify which techniques were caught by security monitoring.

## Inputs

- `persistence-log`: Persistence mechanisms and their deployment times
- `stealth-movement-log`: All red team actions with timestamps

## Outputs

- `detection-timeline`: Timeline showing when each technique was detected or remained undetected
- `detection-gap-analysis`: Techniques and actions that evaded detection entirely

## Process

1. Coordinate with the blue team to obtain their detection timeline
2. Correlate red team actions with blue team alerts and investigations
3. Calculate mean time to detection for each technique category
4. Identify actions that generated no alerts or investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
