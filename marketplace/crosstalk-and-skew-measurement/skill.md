# Crosstalk And Skew Measurement

Measure near-end and far-end crosstalk between adjacent signal pairs and intra-pair skew for differential signals to verify signal isolation and balance.

## Inputs

- `eye-diagram-data`: Eye quality data to correlate with crosstalk effects
- `s-parameter-data`: S-parameter data that may already contain crosstalk information in off-diagonal terms

## Outputs

- `crosstalk-measurement`: NEXT (near-end crosstalk) and FEXT (far-end crosstalk) levels vs frequency between adjacent signal pairs
- `skew-measurement`: Intra-pair skew for each differential pair measured by TDR or by crossing-time comparison
- `coupling-assessment`: Assessment of whether measured crosstalk and skew are within budget for the target BER, with recommended routing rule changes if not

## Process

1. Measure NEXT: drive the aggressor line with a fast edge or broadband signal while the victim line is terminated at both ends. Measure the coupled signal at the near end (same end as the aggressor source). NEXT is caused by capacitive and inductive coupling between adjacent traces. The coupled pulse arrives at the same time as the driving edge.
2. Measure FEXT: same setup as NEXT but measure the coupled signal at the far end (opposite end from the aggressor source). FEXT increases with trace length (longer parallel run = more coupling). For most PCB geometries, FEXT is the dominant crosstalk mechanism for long parallel runs.
3. For 4-port VNA measurements, NEXT and FEXT appear directly in the S-parameter matrix. For a 4-port measurement on two coupled differential pairs, SDD31 is the far-end differential crosstalk. Convert to time domain to see the crosstalk impulse response and identify which physical region along the trace contributes the most coupling.
4. Measure intra-pair skew for differential pairs using TDR: drive the pair in common mode (both lines, same polarity) and look for asymmetry in the reflected waveform. Or, measure the crossing time difference between the positive and negative transitions of a differential signal on an oscilloscope. Skew converts differential signal to common mode, degrading the eye and increasing EMI.
5. Calculate the crosstalk contribution to the eye diagram: FEXT-induced jitter is approximately FEXT_amplitude / signal_slope at the crossing point. Add this to the bounded uncorrelated jitter (BUj) component of the jitter budget. If crosstalk closes the eye below the compliance mask, increase trace spacing (3x dielectric height for less than -40dB FEXT) or add a ground guard trace between aggressors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
