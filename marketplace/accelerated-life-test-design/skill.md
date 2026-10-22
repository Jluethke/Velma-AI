# Accelerated Life Test Design

Design accelerated life tests that compress the failure distribution in time by applying elevated stress levels, enabling reliability demonstration within practical test durations.

## Inputs

- `subsystem-allocations`: Reliability targets for each subsystem
- `allocation-feasibility`: Feasibility assessment
- `improvement-priorities`: Priority list for reliability improvement

## Outputs

- `test-plan`: For each accelerated test: stress type(s), stress levels, number of units, test duration, expected acceleration factor, pass/fail criteria
- `acceleration-model`: The physical model relating stress to failure rate: Arrhenius (temperature), Coffin-Manson (thermal cycling), Peck (temperature + humidity), inverse power law (voltage, vibration)
- `sample-size-calculation`: Number of test units needed to demonstrate the target MTBF at the required confidence level, using the chi-squared distribution for time-terminated tests

## Process

1. Select the acceleration model based on the dominant failure mechanism. For temperature-dependent mechanisms (corrosion, diffusion, chemical degradation): Arrhenius model, AF = exp(Ea/k * (1/T_use - 1/T_test)). Activation energy Ea depends on the mechanism: 0.3-0.5 eV for solder joint fatigue, 0.7-1.0 eV for corrosion, 1.0-1.2 eV for electromigration.
2. For thermal cycling: Coffin-Manson model, AF = (delta_T_test / delta_T_use)^n * (f_use / f_test)^m where n is typically 2-3 for solder joints and m is 0.3-0.5. The acceleration factor depends on the temperature range, not the absolute temperature.
3. Calculate sample size for reliability demonstration. For a time-terminated test with zero failures: MTBF_demonstrated = 2*T*n / chi_squared(alpha, 2) where T is test hours per unit, n is number of units, and alpha is 1 minus the confidence level. To demonstrate 10,000 hours MTBF at 90% confidence with zero failures: total test hours needed = 23,026 hours (2*10000*chi_squared_inv(0.10, 2)/2).
4. Validate the acceleration model before relying on it. Run a series of tests at multiple stress levels and verify that the failure rate follows the predicted model. If the acceleration model is wrong (e.g., a different failure mechanism dominates at the elevated stress), the test results are meaningless. Plot failure rate vs stress on the appropriate scale (Arrhenius: log rate vs 1/T) and verify linearity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
