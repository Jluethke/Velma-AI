# Xrd Crystallite Sizer

Estimate average crystallite size and microstrain from peak broadening using the Scherrer equation and Williamson-Hall analysis.

## Inputs

- `peak-list`: Table of peak positions, intensities, and FWHM values
- `instrument-broadening`: Instrumental broadening profile from a standard reference material

## Outputs

- `crystallite-size`: Estimated crystallite size per phase with uncertainty
- `microstrain-estimate`: Microstrain contribution to broadening if resolved

## Process

1. Correct observed peak widths for instrumental broadening
2. Apply the Scherrer equation to individual peaks for a size estimate
3. Construct a Williamson-Hall plot to separate size and strain contributions
4. Report average crystallite size and microstrain with confidence intervals

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
