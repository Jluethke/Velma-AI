# Corrosion Protection Design

Design the corrosion protection system including material upgrade, coatings, cathodic protection, and chemical treatment to achieve the target design life.

## Inputs

- `corrosion-mechanisms`: Active mechanisms and their severity ranking
- `corrosion-rate-estimate`: Estimated rates for the material-environment combination

## Outputs

- `protection-system`: Complete corrosion protection design: material selection/upgrade, coating system, cathodic protection, chemical inhibition, and corrosion allowance
- `design-life-calculation`: Calculated component life based on the corrosion allowance and protected corrosion rate, with the inspection interval to verify

## Process

1. Material selection or upgrade. If the corrosion rate on carbon steel exceeds the practical corrosion allowance (typically 3-6mm over the design life), consider upgrading to a corrosion-resistant alloy (CRA). For CO2 corrosion: 13Cr (UNS S41000) for downhole tubing below 150C and moderate chloride. For higher chloride or temperature: super duplex (UNS S32750, PREN > 40). For H2S: NACE MR0175 limits apply to hardness and yield strength.
2. Coating system design. For external atmospheric corrosion: surface preparation to SSPC-SP10 / ISO Sa 2.5 (near-white blast), zinc-rich primer (75-90% zinc by weight in dry film), intermediate coat (epoxy), topcoat (polyurethane for UV resistance). Total DFT typically 200-350 microns depending on corrosivity category (ISO 12944 C3 to CX). For internal linings: liquid epoxy, rubber lining, or fluoropolymer depending on the chemical environment and temperature.
3. Cathodic protection. For buried pipelines and marine structures: calculate the current density required to polarize the structure to the protection potential (-850 mV vs Cu/CuSO4 for steel in soil, -800 mV vs Ag/AgCl for steel in seawater). Sacrificial anodes (zinc or aluminum alloy): calculate the anode mass from the current requirement, the anode current capacity (A-h/kg), and the design life. Impressed current: calculate the rectifier output and anode ground bed design.
4. Chemical inhibition for internal corrosion in pipelines and vessels. Film-forming corrosion inhibitors reduce the CO2 corrosion rate by 80-95% when applied at the correct concentration (typically 5-50 ppm continuous, or batch treatment at higher concentration). Verify inhibitor effectiveness by corrosion coupon monitoring and/or electrical resistance (ER) probes or linear polarization resistance (LPR) probes. Set the residual corrosion rate target (typically below 0.1 mm/year with inhibition).
5. Set the corrosion allowance. For carbon steel in corrosive service: corrosion allowance = protected corrosion rate * design life + margin for upset conditions. Typical corrosion allowances range from 1.5mm (mild service, good inhibition) to 6mm (aggressive service without inhibition). The corrosion allowance determines the minimum required wall thickness: t_min = t_design + CA. For CRA, the corrosion allowance is typically zero unless localized corrosion (pitting) applies, in which case design by maximum expected pit depth.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
