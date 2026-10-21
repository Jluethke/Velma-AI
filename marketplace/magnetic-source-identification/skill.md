# Magnetic Source Identification

Identify individual magnetic sources from the RTP anomaly using derivative analysis, analytic signal, and tilt angle methods.

## Inputs

- `rtp-anomaly`: Reduced-to-pole magnetic anomaly grid
- `geological-context`: Known geology and expected magnetic rock types

## Outputs

- `source-catalog`: List of identified magnetic sources with locations and anomaly characteristics
- `derivative-maps`: First vertical derivative, analytic signal, and tilt angle maps

## Process

1. Compute the first vertical derivative to sharpen source edges
2. Compute the analytic signal amplitude to locate source centers regardless of magnetization direction
3. Apply the tilt angle method to delineate source boundaries
4. Catalog each distinct source with its location, amplitude, wavelength, and geological interpretation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
