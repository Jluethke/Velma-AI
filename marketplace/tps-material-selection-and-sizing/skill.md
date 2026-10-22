# Tps Material Selection And Sizing

Select the TPS material for each zone and size its thickness to keep the bondline temperature within limits.

## Inputs

- `tps-design-environments`: Peak heating rate and total heat load at each body zone
- `vehicle-constraints`: Mass budget, reusability requirement, and manufacturing constraints

## Outputs

- `tps-material-map`: Material selection for each vehicle zone with justification
- `tps-thickness-map`: Required thickness at each zone from thermal analysis
- `tps-mass-estimate`: Total TPS mass and its distribution

## Process

1. Categorize each zone by heating severity: low heating (< 50 W/cm^2): flexible insulation blankets (AFRSI, SIP) or ceramic tiles (LI-900, FRCI-12). Moderate heating (50 to 200 W/cm^2): reinforced carbon-carbon (RCC), ceramic tiles (AETB, TUFROC), or lightweight ablators (SLA-561V). High heating (200 to 1000 W/cm^2): dense ablators (PICA, Avcoat, carbon phenolic). Extreme heating (> 1000 W/cm^2): high-density carbon phenolic, carbon-carbon with ablation.
2. For ablative TPS, calculate thickness from the energy balance: the ablator absorbs heat by (1) raising its temperature, (2) pyrolyzing the resin (endothermic decomposition), (3) blowing pyrolysis gases into the boundary layer (blocking convective heating), and (4) radiating from the hot surface. Use a material thermal response code (FIAT, TITAN, CMA) to predict the char depth, pyrolysis depth, and bondline temperature as a function of time.
3. Size for the bondline temperature limit: the adhesive bonding the TPS to the structure typically has a limit of 250C (RTV adhesive) or 315C (higher-temperature options). The TPS must be thick enough that the bondline temperature stays below this limit at the end of the entry heating pulse, including the soak-back period after heating ends (the interior continues to heat from thermal conduction after the surface heating stops).
4. For reusable TPS (tiles, blankets), verify that the material can survive the surface temperature without degradation: LI-900 tiles are rated to about 1260C surface temperature. FRCI-12 to about 1370C. RCC to about 1650C. TUFROC to about 1800C. The material must also survive thermal shock (rapid heating and cooling), rain erosion, and handling damage.
5. Add margin: typically 25 to 50% thickness margin is added to the nominal sizing to account for modeling uncertainty, material property variability, and trajectory dispersions. For crewed vehicles, the margin philosophy is more conservative than for robotic missions.
6. Estimate TPS mass: multiply thickness by density at each zone and integrate over the surface area. TPS mass fraction is typically 8 to 15% of entry mass for Earth entry from LEO, and 20 to 35% for lunar or Mars return at higher velocities.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
