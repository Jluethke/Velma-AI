# Shock Test Verification

Design and execute the shock and drop test program, defining pass/fail criteria that catch the actual failure modes rather than just surviving without visible damage.

## Inputs

- `isolator-specification`: Isolation design if used
- `isolation-trade-offs`: Expected behavior during shock

## Outputs

- `test-plan`: Complete shock and drop test plan with sample size, test sequence, pass/fail criteria, and instrumentation requirements
- `acceptance-criteria`: Specific functional tests to run before and after each shock or drop to detect degradation, not just catastrophic failure

## Process

1. Define pass/fail criteria that go beyond visual inspection. Most shock failures are intermittent electrical opens in solder joints or cracked ceramic capacitors that show no external damage. The criteria must include: full electrical functionality test, insulation resistance measurement, boundary scan or JTAG continuity test for BGA connections.
2. Specify the test sequence. IEC 60068-2-27 calls for 3 shocks per direction (positive and negative) in each axis = 18 total shocks. Run functional tests before the first shock (baseline), after each axis (to catch which axis causes failure), and after all shocks are complete.
3. Instrument the test. Mount accelerometers on the product (response) and on the test fixture (control). Use a sample rate at least 10x the highest frequency of interest (for an 11ms pulse, energy extends to about 500 Hz, so sample at 5 kHz minimum). Record time history for post-test analysis.
4. For drop tests, define the drop surface (50mm steel plate on concrete per IEC 60068-2-31), drop height per face, edge, and corner, and number of drops per orientation. Edge and corner drops often cause more damage than flat drops because the impact energy concentrates into a smaller area.
5. Size the test sample. For design qualification: test 3 samples minimum (one is not statistical evidence). For production acceptance: use a sampling plan based on AQL. After test: disassemble one sample for failure analysis (cross-section solder joints at critical locations, dye-and-pry for BGA inspection) even if it passed, to assess remaining margin.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
