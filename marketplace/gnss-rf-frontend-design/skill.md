# Gnss Rf Frontend Design

Design the RF front-end that converts the satellite signal from the antenna to baseband digital samples.

## Inputs

- `gnss-signal-requirements`: Target constellations (GPS, Galileo, GLONASS, BeiDou), frequency bands (L1, L2, L5), and performance requirements
- `operating-constraints`: Size, power, cost, and interference environment

## Outputs

- `rf-architecture`: Complete RF chain from antenna to ADC with component specifications
- `signal-power-budget`: Link budget from satellite to ADC output showing signal and noise levels at each stage

## Process

1. Calculate the received signal power. GPS L1 C/A minimum received power is -158.5 dBW at the antenna. After a typical antenna gain of 3 dBi (RHCP), the signal at the LNA input is approximately -155.5 dBW. The thermal noise floor in the GPS bandwidth (2 MHz for C/A) is kTB = -174 dBm/Hz + 63 dB = -111 dBm, so the pre-correlation SNR is about -25 dB. The signal is below the noise floor and requires code correlation to extract.
2. Select the antenna. For single-frequency survey, a patch antenna provides 3-5 dBi gain at zenith. For multi-frequency, a wideband element (spiral, drooping bow-tie, or stacked patch) covers L1/L2/L5. For anti-jam, a controlled reception pattern antenna (CRPA) with multiple elements enables adaptive nulling. Specify axial ratio (<3 dB), phase center stability, and multipath rejection (choke ring or ground plane).
3. Design the LNA. Noise figure sets the receiver sensitivity. A typical GNSS LNA has NF = 1.5-2.5 dB, gain = 20-30 dB. Place it as close to the antenna as possible to minimize cable loss before amplification. The Friis equation shows that the LNA noise figure dominates the system noise figure when its gain is high enough to suppress downstream noise.
4. Select the downconversion architecture. Direct conversion (zero-IF) is simplest and lowest cost but has DC offset and I/Q imbalance issues. Low-IF (4-20 MHz) avoids DC problems at small complexity increase. Superheterodyne with one or two IF stages provides best selectivity for demanding environments. For multi-constellation, a wideband front-end with digital channelization is increasingly common.
5. Select the ADC. Sampling rate must exceed 2x the bandwidth of interest (typically 4-20 MHz for single-band, 40-80 MHz for wideband). Bit depth: 1-2 bits for simple receivers (3 dB loss for 1-bit), 4-8 bits for interference rejection (AGC needed). Quantization noise adds to the noise floor.
6. Document the complete signal path with gain, noise figure, IP3, image rejection, and spurious-free dynamic range at each stage. Verify that the total gain places the signal within the ADC input range and that the total noise figure meets the sensitivity requirement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
