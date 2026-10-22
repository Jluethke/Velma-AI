# Test Fixture And Setup

Design the test fixture and configure the vibration control system for accurate test execution.

## Inputs

- `test-article-description`: Hardware dimensions, mass, and mounting interface
- `random-vibration-spec`: PSD test profile
- `shock-spec`: Shock test specification

## Outputs

- `fixture-design`: Test fixture design with natural frequency verification showing first mode above the test frequency range
- `control-strategy`: Control accelerometer locations, response limit channels, and control algorithm parameters
- `instrumentation-plan`: Accelerometer locations, sensitivity, mounting method, and data acquisition settings

## Process

1. Design the fixture to be stiff enough that its first natural frequency is above the maximum test frequency (or at least 1.5 times the highest frequency of interest). A fixture resonance within the test band amplifies the input at that frequency and invalidates the test. Use FEA to predict fixture modes with the test article mass.
2. Minimize fixture mass: a heavy fixture reduces the shaker's payload capacity and available acceleration. Use aluminum or magnesium for light fixtures. Bolt patterns must match the test article's mounting interface exactly to replicate service boundary conditions.
3. Place the control accelerometer at the fixture-to-test-article interface. This is the point where the specified environment should be reproduced. Place response accelerometers on the test article to monitor its dynamic response. Set response limits (notching) if the test article must survive without exceeding stress limits at resonances.
4. Configure the vibration controller: set the PSD control profile, tolerance bands, drive limits, and abort levels. For random: the controller adjusts the drive spectrum to maintain the PSD at the control point within tolerance. Loop time should be fast enough to track and correct within 1-2 seconds. Set sigma clipping (typically 3-sigma) to control the instantaneous peak distribution.
5. For shock testing: select the shock generation method. Drop table (half-sine pulse from dropping onto a programmer pad), shaker-based (oscillatory SRS control for complex spectra), or pyrotechnic (for high-frequency, high-amplitude shock). Verify that the measured SRS at the control point envelopes the specification within tolerance (+3/-1.5 dB is typical for SRS tolerance).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
