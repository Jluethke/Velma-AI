# Frf Measurement Execution

Execute frequency response function measurements with proper signal processing, averaging, and quality checks.

## Inputs

- `excitation-method`: Selected excitation approach
- `measurement-grid`: Sensor locations and directions
- `test-configuration`: Complete test setup specification

## Outputs

- `frf-dataset`: Complete set of measured FRFs (magnitude, phase, coherence) across all measurement points
- `driving-point-frf`: Driving point FRF validated for alternating pole-zero pattern
- `measurement-quality-report`: Coherence statistics, linearity check results, and reciprocity validation

## Process

1. Set up the data acquisition system. Configure sampling rate to at least 2.56 times the maximum frequency of interest (provides anti-alias margin). Set block size for frequency resolution (delta-f = 1/T where T is the time block length).
2. For impact testing: select hammer tip hardness to excite the full frequency range (soft tip for low frequencies, hard tip for high). Check the force spectrum has energy across the band. Use force window to zero out post-impact noise. Use exponential window on response to reduce leakage while minimizing bias on damping estimates.
3. For shaker testing: use burst random or swept sine excitation. Burst random avoids leakage without windows. Swept sine gives best signal-to-noise at each frequency but takes longer.
4. Average multiple measurements at each point. Use at least 5 averages for impact, more for noisy environments. Monitor the coherence function: values below 0.9 indicate noise, nonlinearity, or leakage problems at those frequencies.
5. Check the driving point FRF: it must show alternating resonance peaks and antiresonance dips, and the imaginary part must remain single-signed (all negative for accelerance). Failure of either check indicates a measurement or setup error.
6. Verify reciprocity: measure H_ij and H_ji for at least one pair of points. They should overlay within measurement uncertainty. Poor reciprocity indicates nonlinearity or a boundary condition change.
7. Check linearity by measuring at two excitation levels. FRFs should overlay. Divergence indicates nonlinear behavior.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
