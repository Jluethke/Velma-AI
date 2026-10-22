# Wps Development

Develop the Welding Procedure Specification (WPS) with essential variables, non-essential variables, and supplementary essential variables per the governing code.

## Inputs

- `selected-process`: Welding process and its operating envelope
- `joint-configuration`: Joint geometry and dimensions

## Outputs

- `wps-document`: Complete WPS with preheat, interpass temperature, heat input limits, travel speed, electrode specification, shielding gas, and technique details
- `pqr-test-plan`: Procedure Qualification Record test plan: weld coupon dimensions, mechanical tests (tensile, bend, impact, hardness), and acceptance criteria

## Process

1. Set preheat temperature. For carbon steel, calculate from the carbon equivalent (CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15). CE above 0.45 requires preheat. AWS D1.1 Table 3.3 provides minimum preheat by thickness and CE. For high-strength steels, also calculate the critical hydrogen content to avoid hydrogen-assisted cracking using the Yurioka CEN method or comparable.
2. Set interpass temperature maximum. For carbon and low-alloy steels, typically 250-315C depending on the application (lower for quenched and tempered steels to avoid HAZ softening). For austenitic stainless steels, typically 150-175C maximum to avoid sensitization. For duplex stainless steels, 150C maximum to maintain the austenite/ferrite phase balance.
3. Calculate the heat input range. Heat input (kJ/mm) = (V * A * 60) / (S * 1000) where V is voltage, A is current, S is travel speed in mm/min. Apply the thermal efficiency factor (0.6 for GTAW, 0.8 for GMAW, 1.0 for SAW). Maximum heat input is limited by HAZ grain growth (which reduces toughness). Minimum heat input is limited by the need to achieve full fusion and avoid hydrogen cracking.
4. Specify the shielding gas. For GTAW of carbon steel and stainless: pure argon for root, argon with 2% CO2 or O2 additions for GMAW of carbon steel. For aluminum GMAW: pure argon or Ar/He mixtures (helium increases arc energy for thicker sections). Back-purge with argon for stainless steel and reactive metals to prevent root oxidation.
5. Document the WPS on the standard form (AWS QC-7 or ASME format). List all essential variables. Prepare a PQR test coupon that represents the production joint (same P-number, thickness range, position). The coupon must be tested per code: tensile test across the weld (strength must meet base metal minimum), guided bend tests (face and root bends, no open defects over 3mm), and impact testing if required (CVN at the specified temperature for the weld metal and HAZ).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
