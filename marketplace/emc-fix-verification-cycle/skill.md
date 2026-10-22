# Emc Fix Verification Cycle

Implement EMC fixes identified during pre-compliance testing, verify their effectiveness with before/after measurements, and document the changes for the compliance test plan.

## Inputs

- `emission-source-identification`: Identified emission sources and their radiation mechanisms
- `radiated-risk-assessment`: Frequencies and margins requiring improvement

## Outputs

- `fix-verification-data`: Before and after measurements for each fix, showing the emission reduction achieved at each frequency
- `compliance-test-plan`: Test configuration, operating modes, cable routing, and ground arrangement documented for reproducibility at the compliance lab
- `remaining-risk-register`: Any frequencies still at risk after fixes, with contingency plans (additional filtering, shielding, or design changes for next revision)

## Process

1. For conducted emissions fixes: add or modify the input EMI filter. Start with differential mode filtering (series inductor, X-capacitors across the line) for switching frequency harmonics. Add common mode filtering (common mode choke, Y-capacitors to ground) for common mode noise. Measure after each component change to quantify the improvement.
2. For radiated emissions from cables: reduce common-mode current by adding a common mode choke on the cable at the product enclosure exit. For USB and HDMI cables, verify the shield is bonded to the chassis ground (not through a signal connector pin). Add ferrite cores to cables as a quick fix; design proper common mode filtering into the connector interface for the production solution.
3. For radiated emissions from the PCB: reduce the current loop area of the identified source. For switching converters, shorten the hot loop (input capacitor to switch to inductor to output capacitor). For clocks, add series resistance to slow the edge rate if timing margin allows, or route the clock on an inner layer between ground planes.
4. Verify each fix by repeating the pre-compliance measurement with the exact same setup (cable routing, orientation, ground connection). Compare before and after traces at the same spectrum analyzer settings. Record the delta in dB at each problematic frequency.
5. Document the test configuration exactly as it will be set up in the compliance lab: operating mode (typically worst-case from the pre-compliance scan), cable types and lengths, cable routing, accessory connections, ground plane material and size (if table-top equipment), and turntable angle (if known from prior tests). This documentation prevents compliance lab surprises from different test setups.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
