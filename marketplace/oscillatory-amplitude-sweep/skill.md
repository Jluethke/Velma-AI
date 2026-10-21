# Oscillatory Amplitude Sweep

Perform an oscillatory amplitude sweep to determine the linear viscoelastic region (LVER) of the material.

## Inputs

- `loaded-sample`: Material loaded and conditioned in the geometry
- `amplitude-sweep-parameters`: Frequency to hold constant, strain or stress amplitude range

## Outputs

- `amplitude-sweep-data`: Storage modulus (G') and loss modulus (G'') vs strain amplitude
- `lver-limit`: Critical strain marking the end of the linear viscoelastic region

## Process

1. Run a logarithmic strain amplitude sweep at a fixed frequency (typically 1 Hz)
2. Plot G' and G'' vs strain amplitude and identify the plateau region
3. Determine the critical strain where G' drops by 5% from the plateau value
4. Record the LVER limit for use in frequency sweep measurements

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
