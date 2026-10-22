# Adc Calibration Methodology

Design foreground and background calibration techniques to correct offset, gain, INL, and timing errors, enabling the ADC to exceed the raw accuracy of the analog components.

## Inputs

- `dac-topology-and-sizing`: DAC design with expected mismatch
- `selected-architecture`: ADC architecture

## Outputs

- `calibration-scheme`: Calibration algorithm with convergence analysis and overhead estimate
- `expected-improvement`: Pre-calibration vs post-calibration ENOB and INL/DNL

## Process

1. Foreground calibration measures and corrects errors with the ADC offline (not converting signals). Inject known reference voltages and measure the ADC output code. Compute correction coefficients for offset (additive) and gain (multiplicative) for each sub-ADC or pipeline stage.
2. Background calibration corrects errors while the ADC continues normal operation. Split the ADC into redundant paths and compare them. Correlation-based algorithms (e.g., random chopping of DAC elements, pseudo-random perturbation injection) converge slowly but do not interrupt signal conversion.
3. For SAR ADC capacitor mismatch: use a foreground calibration where each MSB capacitor is measured against the sum of smaller capacitors. The error is stored in a digital lookup table. This corrects INL from capacitor mismatch. Split-capacitor SAR ADCs need bridge capacitor calibration as well.
4. For time-interleaved ADCs: calibrate offset, gain, and timing skew between sub-ADCs. Offset and gain use simple averaging and ratio computation. Timing skew is harder: use adaptive digital equalization, correlation-based detection (inject a known signal and measure the interleaving spur), or analog delay adjustment via varactor tuning.
5. For pipeline ADCs: calibrate the MDAC gain error (op-amp finite gain, capacitor ratio error) using digital correction. The redundancy bits in each stage allow the digital backend to correct residue amplification errors up to the redundancy range.
6. Estimate calibration overhead: coefficient storage (N_bits per coefficient * number of coefficients), calibration convergence time (number of samples for the LMS/RLS algorithm to converge), and the ENOB improvement. Typical improvements are 2-4 bits from calibration, enabling a 10-bit raw ADC to deliver 12-14 effective bits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
