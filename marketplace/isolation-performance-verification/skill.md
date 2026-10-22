# Isolation Performance Verification

Verify installed isolation system performance through vibration measurement and compare to design transmissibility.

## Inputs

- `selected-mounts`: Installed mount type and arrangement
- `predicted-performance`: Design transmissibility curve
- `isolation-target`: Required isolation performance

## Outputs

- `measured-transmissibility`: Measured transmissibility from source to receiver across the frequency range
- `isolation-verification-report`: Comparison of measured vs predicted performance with compliance assessment
- `corrective-actions`: Recommended adjustments if performance does not meet specification

## Process

1. Measure vibration on the source side (above mounts on equipment) and receiver side (below mounts on foundation) simultaneously. Use accelerometers at each mount location.
2. Calculate transmissibility as the ratio of receiver to source amplitude at each frequency. Use cross-spectral averaging to improve accuracy.
3. Verify the measured natural frequency by identifying the transmissibility peak. Compare to the design prediction. Common reasons for discrepancy: actual load different from design, mount stiffness different from catalog (mounts stiffen at low temperature and soften at high), installation preload incorrect.
4. Check isolation at each forcing frequency. If isolation is worse than predicted, investigate: short-circuit paths (rigid connections bypassing mounts such as piping, conduit, or a tool left on the machine), mount overload, or a structural resonance of the foundation at the forcing frequency.
5. For sensitive equipment, measure the vibration spectrum at the equipment and compare to the VC curve criterion. Floor-to-equipment transmissibility alone is not sufficient; the absolute level at the equipment matters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
