# Coating Performance Validation

Validate the coating performance through tribological testing, corrosion testing, and field trial correlation to confirm that it meets the application requirements.

## Inputs

- `trial-coating-results`: Measured properties of the trial coating
- `application-requirements`: Operating conditions and target life

## Outputs

- `performance-test-results`: Tribological test results (friction coefficient, wear rate, wear mechanism), corrosion test results, and any accelerated life test data
- `coating-specification-document`: Final coating specification for procurement or in-house production, including all acceptance criteria and inspection methods

## Process

1. Tribological testing. Pin-on-disc (ASTM G99) for sliding wear: measure the friction coefficient and specific wear rate (mm^3 / N*m) against the specified counter-body material at the relevant speed, load, and temperature. Block-on-ring (ASTM G77) for conforming contact. Reciprocating ball-on-flat (ASTM G133) for fretting or oscillating applications. The test conditions must approximate the application conditions; wear mechanisms change with contact pressure and temperature, so a test at the wrong conditions gives misleading data.
2. Corrosion testing. Neutral salt spray (ASTM B117) for general atmospheric corrosion resistance (number of hours to red rust or white rust). Electrochemical testing (potentiodynamic polarization per ASTM G5) for quantitative comparison of coatings (corrosion potential, corrosion current density, pitting potential). Immersion testing in the actual service fluid at temperature for process equipment coatings. The test duration and conditions must be relevant to the application; a 500-hour salt spray test on an automotive fastener is meaningful, but on a downhole tool it is not.
3. Accelerated life testing where feasible. For cutting tools: run the coated tool in the actual machining operation and measure tool life vs the uncoated or current-coating baseline. For wear components: run a bench test that simulates the actual duty cycle at accelerated frequency or load. Correlate the accelerated test results to field life using the known acceleration factor or by comparison to field data from the current coating.
4. Write the coating specification. Include: coating material and composition, thickness range, hardness range, adhesion minimum (Lc2 or Rockwell indentation per VDI 3198: HF1-HF4 acceptable, HF5-HF6 unacceptable), surface roughness after coating, visual appearance acceptance criteria, and any post-treatment requirements. Reference the applicable standards (ISO 6158 for electroplated chromium, ISO 26443 for PVD coatings, ISO 14919 for thermal spray). Define the lot acceptance test plan: which tests on every lot (thickness, hardness, adhesion on a test coupon) and which tests periodically (full characterization including composition, tribological testing).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
