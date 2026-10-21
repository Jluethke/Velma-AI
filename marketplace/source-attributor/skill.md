# Source Attributor

Attribute detected pollution events to likely sources using wind analysis, chemical fingerprinting, and spatial modeling.

## Inputs

- `anomaly-list`: Detected anomaly events from the detection step
- `meteorological-data`: Wind speed, direction, mixing height, and precipitation records
- `source-inventory`: Known emission sources with locations, types, and estimated output rates

## Outputs

- `source-attribution`: Probable source assignments for each anomaly event with confidence levels
- `transport-analysis`: Back-trajectory or dispersion modeling results linking event to source area
- `fingerprint-match`: Chemical ratio or isotope signature comparison against known source profiles

## Process

1. Run back-trajectory analysis (HYSPLIT or equivalent) for each anomaly event
2. Compare chemical ratios at the receptor against known source fingerprints
3. Cross-reference trajectory results with the source inventory within the footprint area
4. Assign attribution confidence based on meteorological consistency and chemical match
5. Document alternative explanations where attribution is uncertain

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
