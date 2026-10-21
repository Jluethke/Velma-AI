# Reduction To Pole

Transform the magnetic anomaly to what it would look like at the magnetic north pole, centering anomalies over their sources.

## Inputs

- `corrected-magnetic-anomaly`: Gridded magnetic anomaly after diurnal and IGRF removal
- `field-parameters`: Magnetic inclination and declination at the survey location

## Outputs

- `rtp-anomaly`: Reduced-to-pole magnetic anomaly grid
- `rtp-quality-check`: Comparison of original and RTP anomaly shapes to verify the transformation

## Process

1. Compute the reduction-to-pole operator in the frequency domain using the local field direction
2. Apply the operator to the gridded anomaly, handling low-latitude instability if needed
3. Compare anomaly shapes before and after RTP to confirm sources are now centered under their anomalies
4. Document the field parameters and any stabilization applied

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
