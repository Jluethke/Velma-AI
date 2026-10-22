# Intermodulation Measurement

Measure the intermodulation performance of the receiver chain or individual components using two-tone and modulated signal tests.

## Inputs

- `dynamic-range-analysis`: Predicted SFDR and IP3 values to verify
- `receiver-architecture`: DUT identification and test setup requirements

## Outputs

- `measured-ip3-compression`: Measured IIP3, OIP3, P1dB, and Psat from two-tone test and power sweep, compared to cascade prediction
- `intermod-measurement-record`: Complete measurement record: test setup, signal generator levels, spectrum analyzer settings, measured data, and correlation with prediction

## Process

1. Two-tone IP3 measurement: apply two equal-amplitude CW tones spaced by delta_f (typically 1 to 10 MHz for wideband systems, 10 to 100 kHz for narrowband). Set the tone power at least 10 dB below the expected P1dB to stay in the small-signal region.
2. Measure the output spectrum on a spectrum analyzer. Record the power of the fundamental tones (P_fund) and the third-order products at 2f1-f2 and 2f2-f1 (P_IM3). Calculate OIP3 = P_fund + (P_fund - P_IM3)/2.
3. Verify the 3:1 slope: reduce the input power by 1 dB and confirm IM3 drops by 3 dB. If the slope is not 3:1, the device is not in the weakly nonlinear regime (either compressed or near the noise floor). Adjust the input level.
4. Measure P1dB: sweep the input power of a single CW tone and plot gain vs. input power. The 1 dB compression point is where the gain drops 1 dB from its small-signal value. Record both input and output P1dB.
5. For IP2 measurement: use two tones at f1 and f2 where f2 - f1 falls in the IF band. This is critical for direct-conversion receivers. IP2 is measured similarly: OIP2 = P_fund + (P_fund - P_IM2).
6. Compare all measurements to the cascade analysis predictions. If measured IP3 is lower (worse) than predicted, check for: oscillation at out-of-band frequencies (very common cause of unexpected nonlinearity), impedance mismatch between stages, or leakage/coupling on the PCB.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
