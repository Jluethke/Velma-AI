# Lidar Optical Receiver Design

Design the lidar receiver including the detector, optics, and signal processing for the target detection range and false alarm rate.

## Inputs

- `ranging-method`: Selected ranging approach
- `laser-source-selection`: Wavelength and power level
- `range-requirement`: Detection range at target reflectivity

## Outputs

- `detector-selection`: Detector type and specifications (APD, SPAD, SiPM, balanced detector for FMCW)
- `receiver-optics-design`: Collection aperture, filter, and focusing design
- `signal-processing-chain`: Threshold, timing, or FFT processing for range extraction

## Process

1. Select the detector. For 905nm dToF: silicon APD (gain 100-200, NEP ~0.1 pW/sqrt(Hz)) or SiPM/SPAD array (single-photon sensitivity, but saturate in bright ambient). For 1550nm dToF: InGaAs APD (gain 10-30, higher dark current than Si). For FMCW: balanced InGaAs photodetectors (coherent detection gives shot-noise-limited sensitivity, no avalanche gain needed). For flash lidar: 2D detector array (InGaAs focal plane array or SPAD array).
2. Design the receiver optics. Collection aperture determines the received signal power (larger aperture = more signal but bigger, heavier optic). Typical: 20-75mm diameter lens for automotive, 100-200mm for survey. A narrowband optical filter (1-10nm bandwidth centered on the laser wavelength) rejects ambient solar background. The filter bandwidth must accommodate the laser wavelength tolerance and temperature shift. Focus the collected light onto the detector active area.
3. For dToF, design the timing discrimination. Leading-edge discriminator: simple but walk error (timing depends on signal amplitude). Constant fraction discriminator (CFD): triggers at a fixed fraction of the pulse peak, eliminating walk error. Time-to-digital converter (TDC) resolution sets the range granularity (1 ns = 15 cm). Multiple-return detection: the TDC captures all returns above threshold, enabling detection through vegetation or rain.
4. For FMCW, design the coherent processing. Mix the returned signal with the local oscillator on a balanced detector. The beat frequency f_beat = 2*R*chirp_rate/c gives the range. FFT of the beat signal with N points gives range resolution c/(2*B) where B is the chirp bandwidth (e.g., B = 10 GHz gives 1.5 cm resolution). Doppler shift adds to the beat frequency; use triangle-wave chirp (up-down) to separate range from velocity.
5. Analyze the detection probability and false alarm rate. For dToF with threshold detection: P_detect = Q-function(SNR - threshold). P_false_alarm = Q-function(threshold / noise_rms). Set the threshold for the desired P_fa (typically 1e-6 per range bin per shot) and calculate the resulting P_detect at maximum range. If P_detect is too low, increase averaging (multiple pulses), increase transmit power, or increase the aperture.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
