# Cyclic Voltammetry Scan

Measure cyclic voltammograms at multiple scan rates to characterize the electrode's redox behavior.

## Inputs

- `electrode-setup`: Working electrode, counter electrode, reference electrode, and electrolyte composition
- `scan-parameters`: Potential window, scan rates (mV/s), and number of cycles

## Outputs

- `cv-data`: Current-voltage curves at each scan rate with peak positions and currents
- `redox-characterization`: Peak potentials, peak separation, reversibility assessment, and scan rate dependence

## Process

1. Set up the three-electrode cell and purge with inert gas if needed
2. Record CVs at the lowest scan rate first, increasing through the series
3. Identify anodic and cathodic peak potentials and currents at each scan rate
4. Assess reversibility from peak separation and the peak current vs square root of scan rate plot

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
