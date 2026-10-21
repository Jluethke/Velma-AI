# Focal Mechanism Determination

Determine earthquake focal mechanisms (fault plane solutions) from P-wave first motions or moment tensor inversion.

## Inputs

- `event-catalog`: Located events for mechanism analysis
- `processed-traces`: Broadband waveforms for moment tensor inversion

## Outputs

- `focal-mechanisms`: Beach ball plots with strike, dip, and rake for each solved event
- `stress-field-indicators`: Principal stress orientations inferred from mechanism population

## Process

1. Pick P-wave first motion polarities at each station for well-recorded events
2. Solve the fault plane solution by grid search over the focal sphere
3. For larger events, run full waveform moment tensor inversion
4. Invert the mechanism population for regional stress tensor orientation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
