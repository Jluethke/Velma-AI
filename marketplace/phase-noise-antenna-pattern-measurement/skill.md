# Phase Noise Antenna Pattern Measurement

Measure phase noise of oscillators and radiation patterns of antennas using specialized techniques and setups.

## Inputs

- `measurement-requirement`: Phase noise measurement of an oscillator/synthesizer, or antenna pattern measurement
- `dut-description`: Device under test with approximate specifications

## Outputs

- `specialized-measurement-result`: Phase noise plot (dBc/Hz vs. offset) or antenna pattern (gain vs. angle in E-plane and H-plane) with measurement setup documented
- `measurement-limitations`: Known limitations of the measurement: instrument noise floor, dynamic range, angular resolution, and any corrections or assumptions

## Process

1. Phase noise measurement via direct spectrum: tune the spectrum analyzer to the carrier, set RBW to the offset of interest (e.g., 1 kHz RBW for 10 kHz offset measurement), and measure the noise power in that bandwidth. L(f) = P_noise_in_1Hz_BW - P_carrier = P_measured - P_carrier - 10*log10(RBW) + correction_factors. This method is limited by the spectrum analyzer's own phase noise.
2. Phase noise measurement via PLL-based method (signal source analyzer): the instrument locks an internal clean reference to the DUT, and the PLL error voltage represents the phase noise. This method has a lower noise floor than direct spectrum, especially at close-in offsets. Cross-correlation (two independent measurement channels averaged) reduces the floor further, by 5*log10(N_correlations) dB.
3. For antenna pattern measurement: set up the DUT on a positioner in an anechoic chamber or on an outdoor range. The source antenna illuminates the DUT from the far field (minimum distance 2*D^2/lambda). Rotate the DUT in azimuth and elevation while recording the received power.
4. For near-field to far-field: scan the near field on a planar surface (for directive antennas) or spherical surface (for omnidirectional). Sample spacing must be less than lambda/2 (Nyquist). The far field is computed by Fourier transform of the measured near-field data. This method is more compact and controlled than a far-field range.
5. Measure gain by substitution: in the same setup, replace the DUT with a standard gain horn of known gain. The DUT gain = horn_gain + (P_received_DUT - P_received_horn). This eliminates path loss and cable loss from the calculation.
6. Document the measurement limitations: anechoic chamber quiet zone size and reflectivity level, positioner alignment accuracy, source antenna pattern (any illumination taper across the DUT aperture reduces measured gain), and cable flexing during rotation (use a rotary joint or route cables to minimize movement).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
