# Vibration Test Fixture Design

Design the vibration test fixture to faithfully transmit the shaker input to the test article without introducing fixture resonances that corrupt the test.

## Inputs

- `fatigue-life-predictions`: Critical components and failure modes to test for
- `design-margin`: Components with lowest margin are highest priority for test

## Outputs

- `fixture-design`: Test fixture geometry, material, and mounting scheme with predicted fixture natural frequency above 5x the test bandwidth
- `test-procedure`: Vibration test procedure including pre-test resonance search, test levels, axis sequence, and pass/fail criteria

## Process

1. Set the fixture first natural frequency target at a minimum of 5 times the highest frequency in the test profile (preferably 10x). For a test profile extending to 2000 Hz, the fixture must resonate above 10,000 Hz. This requires a stiff, low-mass fixture.
2. Select fixture material. Magnesium alloy has the highest stiffness-to-density ratio (specific modulus E/rho = 25 GPa/(1740 kg/m^3) = 14.4 MNm/kg) and is the standard for vibration fixtures. Aluminum (E/rho = 26) is acceptable and easier to machine. Steel is too heavy.
3. Design the fixture as a thick, ribbed plate. Thickness drives natural frequency (fn proportional to h). Add ribs on the back side to increase stiffness without adding excessive mass. Mount the test article on the same surface as in the actual product to replicate boundary conditions.
4. Verify the fixture with a low-level resonance survey before running the full test. Sweep a sine wave at 0.5g from 20 Hz to the upper test frequency. Monitor the response with an accelerometer on the fixture near the test article. Any resonance that amplifies the input by more than 3 dB (factor of 1.4) within the test band corrupts the test data.
5. Write the test procedure: start with a low-level resonance survey, then ramp to full test level in each axis. Monitor control accelerometer (on the fixture, at the mounting point) and response accelerometer (on the test article). Abort criteria: control channel more than 3 dB from the reference profile, or obvious structural failure (noise, smoke, visual damage). Run post-test resonance survey and compare to pre-test to detect shifted resonances indicating fatigue damage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
