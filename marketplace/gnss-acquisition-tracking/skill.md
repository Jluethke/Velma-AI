# Gnss Acquisition Tracking

Design the signal acquisition and tracking algorithms that lock onto satellite signals and maintain continuous measurement of code phase and carrier phase.

## Inputs

- `rf-architecture`: RF front-end design with ADC output characteristics
- `signal-power-budget`: Expected C/N0 at the correlator input

## Outputs

- `acquisition-algorithm`: Algorithm for initial detection of satellite signals with time-to-first-fix performance
- `tracking-loop-design`: Code and carrier tracking loop architectures with bandwidth, pull-in range, and dynamic stress tolerance

## Process

1. Design the acquisition algorithm. The receiver must search a 2D space: code phase (1023 chips for GPS C/A, 0.5-chip steps = 2046 bins) and Doppler frequency (+/-5 kHz for stationary, +/-10 kHz with initial velocity uncertainty, 500 Hz steps = 20-40 bins). Serial search tests one cell at a time (slow). Parallel code phase search uses FFT: correlate the incoming signal with the local code replica in the frequency domain, testing all code phases simultaneously for each Doppler bin. This reduces acquisition time by 1000x.
2. Set the detection threshold. For a given false alarm probability (Pfa) and detection probability (Pd), the threshold depends on the coherent integration time and the number of non-coherent accumulations. Longer coherent integration improves sensitivity by 3 dB per doubling but requires finer Doppler search (Doppler resolution = 1/T_coh). For weak signals (-155 dBm), use 10-20 ms coherent integration with 10+ non-coherent accumulations.
3. Design the code tracking loop (DLL). The early-minus-late discriminator measures code phase error. Correlator spacing (early-late): 1 chip for standard, 0.1-0.5 chip for narrow correlator (reduces multipath error). Loop bandwidth: 1-2 Hz for static, 5-10 Hz for high dynamics. Loop order: first-order tracks constant velocity, second-order tracks constant acceleration. The code loop noise is sigma_code = (BW_L * d / (2 * C/N0))^0.5 chips, where d is correlator spacing.
4. Design the carrier tracking loop (PLL/FLL). PLL tracks carrier phase for precise measurements: loop bandwidth 10-25 Hz, loop order 2 or 3. PLL threshold: C/N0 > 25 dB-Hz for 15 Hz bandwidth. Below threshold, fall back to FLL which tracks frequency and tolerates lower C/N0 (~18 dB-Hz). For high dynamics, use FLL-assisted PLL. Carrier loop stress limit: for third-order PLL with 18 Hz bandwidth, maximum jerk tolerance is approximately 10 g/s.
5. Implement bit synchronization and navigation message demodulation. GPS C/A data rate is 50 bps. Bit edges are found by detecting the phase reversal at 20 ms intervals. For modernized signals with pilot channels (L2C, L5, Galileo), data-free tracking enables longer coherent integration and improved sensitivity.
6. Document the time-to-first-fix (cold start: 30-60 s with almanac, hot start: 1-5 s with ephemeris), tracking sensitivity (minimum C/N0 for sustained tracking), and dynamic performance (maximum acceleration, jerk) for the designed receiver.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
