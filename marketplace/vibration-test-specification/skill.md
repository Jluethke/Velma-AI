# Vibration Test Specification

Define vibration and shock test levels from the service environment, applicable standards, and qualification philosophy.

## Inputs

- `service-environment`: Description of the operational vibration and shock environment (vehicle, aircraft, launch, industrial) with measured or predicted spectra
- `applicable-standards`: Test standards to follow (MIL-STD-810, RTCA DO-160, IEC 60068, JEDEC, or program-specific)
- `test-article-description`: Hardware to be tested including mass, dimensions, mounting interface, and functional requirements during and after test

## Outputs

- `random-vibration-spec`: PSD profile (g^2/Hz vs frequency) with duration, axes, and Grms for each test condition
- `sine-vibration-spec`: Swept sine profile (g vs frequency), sweep rate, and axes if sine testing is required
- `shock-spec`: Shock response spectrum (g vs frequency) or classical pulse (half-sine, trapezoidal) with number of shocks per axis

## Process

1. Start from the measured or predicted service environment. If measured data exists: derive the PSD from time history using Welch's method. If no data: use published spectra from the applicable standard (MIL-STD-810 provides environments for ground vehicle, aircraft, ship, etc.).
2. Apply qualification margin: typically 6 dB above the maximum expected environment for prototype qualification (to demonstrate margin), or 3 dB above for acceptance testing (to screen defects without consuming excessive life). Duration is typically 3 minutes per axis for qualification; acceptance is shorter.
3. For random vibration: define PSD breakpoints in g^2/Hz at key frequencies. Specify the tolerance band (typically +/- 3 dB). Calculate the overall Grms level by integrating the PSD: Grms = sqrt(integral of PSD over frequency). This is the RMS acceleration the test article experiences.
4. For shock: derive the SRS from the measured shock pulse or specify the SRS directly from the standard. The SRS shows the peak response of a single-DOF system at each natural frequency. Quality factor Q = 10 is standard unless specified otherwise. Specify number of shocks per direction (typically 3 positive and 3 negative per axis).
5. Tailor the test to the actual environment when the standard envelope is overly conservative. Environmental test tailoring per MIL-STD-810 Method 500.6 allows adjusting levels based on measured data, reducing unnecessary testing while maintaining qualification integrity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
