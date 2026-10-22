# Post Silicon Trimming Design

Design on-chip trim and calibration circuits that correct process variation after fabrication, enabling precision beyond what the untrimmed design can achieve.

## Inputs

- `yield-estimate`: Current yield showing which parameters still fail after centering
- `centered-design`: Optimized design

## Outputs

- `trim-circuit-design`: Trimming circuits with resolution, range, and storage mechanism
- `trim-augmented-yield`: Yield after trimming, with test time estimate

## Process

1. Identify parameters that benefit from trimming: offset voltage, reference voltage, oscillator frequency, and bias current are the most common. Trimming corrects the residual variation that design centering cannot eliminate without excessive area.
2. Trim resolution: the trim step must be smaller than the required accuracy. For a 1 mV offset specification, the trim step must be < 0.5 mV. Trim range: must cover the 3-sigma (or target sigma) variation range. Number of trim bits = ceil(log2(range / step)).
3. Trim implementation: switched current sources (binary-weighted MOSFET array) for bias current trim, switched capacitors for frequency or offset trim, resistor trim (laser or e-fuse). E-fuses (electrically programmable) are preferred for post-package trim: program by forcing high current (10-20 mA) through a thin metal link.
4. One-time programmable (OTP) storage: e-fuses or anti-fuses for permanent trim. MTP (multi-time programmable): floating-gate or charge-trap cells allow re-trimming. SRAM-based trim loads from external memory at power-up (no permanent storage, but unlimited adjustability).
5. Trim algorithm: for each die on the wafer, the ATE (automated test equipment) measures the parameter, calculates the optimal trim code, and programs it. Test time per trim = measurement time + programming time + verification time. For production, total trim time must be under 100 ms per parameter to keep test costs acceptable.
6. Calculate the trim-augmented yield: untrimmed yield is the fraction within spec before trimming. Trimmed yield is the fraction within spec after applying the optimal trim code. If the trim range covers +/- 3 sigma and the resolution is < 0.5 sigma, trimmed yield exceeds 99.9% for that parameter.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
