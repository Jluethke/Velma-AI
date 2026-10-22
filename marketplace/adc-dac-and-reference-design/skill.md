# Adc Dac And Reference Design

Design the internal DAC and reference circuits that set the ADC's linearity, covering charge redistribution, current steering, and resistor ladder topologies.

## Inputs

- `selected-architecture`: ADC architecture determining DAC type
- `resolution-requirement`: Resolution setting DAC matching requirements

## Outputs

- `dac-topology-and-sizing`: DAC circuit with capacitor/current-source/resistor sizes for target INL/DNL
- `reference-circuit`: Voltage or current reference design with PSRR and temperature coefficient

## Process

1. For SAR ADC: charge redistribution DAC. Binary-weighted capacitor array where each capacitor is 2x the previous. Total capacitance C_total = 2^N * C_unit. For >10 bits, use a split-capacitor (bridge capacitor) architecture to reduce total capacitance from 2^N to 2^(N/2) + 2^(N/2) * C_unit.
2. Capacitor matching requirement: for N-bit INL < 0.5 LSB, the unit capacitor mismatch sigma_C/C must be < 1/(2^(N+1) * sqrt(6)). Mismatch scales as sigma_C/C = A_C / sqrt(W*L) for MIM capacitors, where A_C is process-dependent (typically 0.3-1% * um). This sets the minimum unit capacitor size.
3. For pipeline ADC: the MDAC (multiplying DAC) combines DAC and residue amplification. The op-amp gain error, capacitor mismatch, and incomplete settling all contribute to INL. Each stage needs accuracy only to the level of digital correction overlap (typically 0.5-1 bit of redundancy).
4. For sigma-delta ADC: the feedback DAC must be as accurate as the full-resolution output. Multi-bit DACs in the feedback loop need element mismatch shaping (data-weighted averaging) to push DAC errors out of band, or use a single-bit DAC (inherently linear but higher quantization noise).
5. Reference design: bandgap voltage reference provides approximately 1.2V with low temperature coefficient (10-50 ppm/C). For sub-1V supplies, use a current-mode bandgap. PSRR of the reference directly affects ADC PSRR. Add a low-noise LDO or buffer between the bandgap and the DAC reference input.
6. Reference noise directly adds to ADC noise. Reference noise spectral density * sqrt(bandwidth) must be less than 0.5 LSB. For a 14-bit ADC with 1V reference and 100 MHz bandwidth, the reference noise must be < 2 nV/sqrt(Hz). This typically requires a dedicated low-noise reference buffer.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
