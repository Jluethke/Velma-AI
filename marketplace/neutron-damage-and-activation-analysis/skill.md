# Neutron Damage And Activation Analysis

Calculate neutron damage accumulation, transmutation products, and activation levels in structural materials under 14.1 MeV fusion neutron irradiation.

## Inputs

- `neutron-spectrum`: Energy-dependent neutron flux at each blanket location
- `material-candidates`: Structural material options for assessment

## Outputs

- `damage-assessment`: DPA/year, helium and hydrogen generation rates for each material
- `activation-analysis`: Contact dose rates, decay heat, and waste classification over time
- `lifetime-estimate`: Estimated blanket replacement interval from damage limits

## Process

1. Calculate displacement damage: neutron transport code (MCNP, Serpent) with NRT model gives dpa/year = sigma_d * phi where sigma_d is the displacement cross-section and phi is the flux. For a fusion power plant first wall at 2 MW/m2: ~20-30 dpa/year in steel.
2. Calculate transmutation gas production: (n,alpha) reactions produce helium in steel at ~10 appm He/dpa for fusion neutrons (much higher He/dpa ratio than fission due to high-energy threshold reactions). Helium embrittlement limits ductility and drives swelling at high temperature.
3. Run activation calculation (FISPACT, ALARA) for shutdown dose rate and waste disposal rating. RAFM steels (Eurofer, F82H) designed with low-activation elements (Fe, Cr, W, V, Ta) avoid long-lived isotopes (no Ni, Co, Nb, Mo ideally).
4. Determine blanket replacement schedule: typical limit 50-80 dpa for RAFM steel (irradiation data extrapolation), or when ductility falls below minimum for structural integrity. For 2 MW/m2 wall loading, replacement every 2-4 full-power years.
5. Assess waste classification: with RAFM steel and careful material selection, all blanket waste should qualify as low-level waste (recyclable after ~100 years decay) rather than high-level. This is a major advantage of fusion over fission.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
