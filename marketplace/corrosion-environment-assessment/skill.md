# Corrosion Environment Assessment

Characterize the corrosion environment and identify the applicable corrosion mechanisms for the material-environment combination.

## Inputs

- `operating-environment`: Temperature, pressure, chemical composition (pH, chloride, CO2, H2S, oxygen, water chemistry), flow velocity, and any cyclic conditions
- `material-of-construction`: Alloy specification and condition (base metal, welds, heat-affected zones)

## Outputs

- `corrosion-mechanisms`: Identified active corrosion mechanisms ranked by expected severity (general, pitting, crevice, SCC, MIC, erosion-corrosion, galvanic, hydrogen damage)
- `corrosion-rate-estimate`: Estimated corrosion rates from published data, models (de Waard-Milliams for CO2, NORSOK M-506), or operating experience with similar systems

## Process

1. Map the material to the environment using established corrosion diagrams. For stainless steels in chloride environments: use the pitting resistance equivalent number (PREN = Cr + 3.3Mo + 16N) and compare to the critical pitting temperature (CPT) for the chloride concentration. For carbon steel in CO2 service: calculate the CO2 partial pressure and temperature to estimate the CO2 corrosion rate using de Waard-Milliams or NORSOK M-506. For H2S service: classify by NACE MR0175/ISO 15156 (sour service limits on hardness and material).
2. Identify localized corrosion risks. Crevice corrosion at gaskets, flanges, tube-to-tubesheet joints (more aggressive than pitting because the crevice concentrates chloride and depletes oxygen). Galvanic corrosion at dissimilar metal connections (rank by the galvanic series in the actual environment, not the standard EMF series). Microbiologically influenced corrosion (MIC) in low-flow or stagnant water systems (sulfate-reducing bacteria produce H2S locally). Stress corrosion cracking where tensile stress + susceptible material + specific environment intersect (e.g., chloride SCC of austenitic stainless steel above 60C).
3. Estimate the corrosion rate from the best available data. Corrosion coupons from similar service (weight loss per ASTM G1). Published corrosion data (NACE, MTI). Models calibrated to field data. For CO2 corrosion of carbon steel, the de Waard-Milliams model gives a baseline rate corrected for pH, temperature, and flow velocity. Apply a factor of safety (typically 2-3x) to the predicted rate for design purposes to account for model uncertainty and upset conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
