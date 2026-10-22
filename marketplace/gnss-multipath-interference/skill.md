# Gnss Multipath Interference

Design techniques to mitigate multipath errors and intentional/unintentional interference in the GNSS receiver.

## Inputs

- `navigation-algorithm`: Navigation solution providing position and measurement residuals
- `rf-architecture`: RF front-end design parameters

## Outputs

- `multipath-mitigation`: Techniques and their effectiveness for reducing multipath-induced position errors
- `interference-countermeasures`: Detection and mitigation methods for jamming and spoofing

## Process

1. Characterize multipath. Short-delay multipath (<1 chip, <300 m for C/A code) distorts the correlation peak and biases the DLL. Long-delay multipath is resolved by the correlator and rejected. Carrier phase multipath has maximum error of quarter-wavelength (~5 cm for L1) and oscillates as geometry changes. Code multipath can be tens of meters for C/A.
2. Implement narrow correlator. Reducing early-late spacing from 1 chip to 0.1 chip reduces the multipath error envelope by roughly 10x for short-delay multipath. Requires higher front-end bandwidth. Strobe correlator and double-delta correlator provide further improvement by sharpening the discrimination of the direct signal from reflections.
3. Antenna-based multipath mitigation. Choke ring antennas attenuate signals arriving below the horizon (ground reflections). For survey/reference stations, this is the primary multipath defense. For mobile platforms, antenna placement to avoid nearby reflectors is the main lever.
4. Detect and characterize interference. Monitor the AGC level or noise floor estimate. A narrowband interferer raises the noise floor locally and can be detected by spectral monitoring. A wideband jammer raises the overall noise floor, reducing C/N0 on all satellites. A spoofer transmits fake GNSS signals; detect by monitoring C/N0 anomalies, clock drift, or consistency with INS.
5. Implement interference mitigation. Narrowband: adaptive notch filter in the digital domain, identified from the FFT of the ADC output. Wideband: null-steering with a multi-element antenna (CRPA) using adaptive beamforming. Spoofing: cross-check GNSS with INS (velocity and position consistency), monitor for sudden position jumps, use authenticated signals (Galileo OSNMA) where available.
6. Quantify residual errors after mitigation and feed into the navigation accuracy prediction. For a survey receiver with choke ring antenna and narrow correlator, residual multipath is typically 1-5 cm on carrier phase and 10-50 cm on code. For a mobile receiver with a patch antenna, residual multipath is 0.5-5 m on code.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
