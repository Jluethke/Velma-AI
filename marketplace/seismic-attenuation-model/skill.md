# Seismic Attenuation Model

Model seismic wave attenuation (Q) for the study region to support ground motion prediction and hazard calculations.

## Inputs

- `magnitude-catalog`: Events with magnitudes and station data
- `processed-traces`: Waveforms for spectral decay measurement

## Outputs

- `attenuation-model`: Frequency-dependent Q model and geometric spreading function for the region
- `site-amplification`: Site response estimates (Vs30-based or H/V ratio) for each station

## Process

1. Measure spectral amplitudes at multiple distances for a set of reference events
2. Invert for path attenuation (Q) and site amplification simultaneously
3. Validate the Q model by comparing predicted and observed spectral amplitudes for an independent event set
4. Estimate site amplification at each station from Vs30 proxies or horizontal-to-vertical spectral ratios

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
