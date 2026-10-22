# Tps Material Selection

Select TPS materials for each zone of the vehicle based on heating environment, reusability requirement, and mass budget.

## Inputs

- `stagnation-heating-profile`: Peak heat flux and total heat load at stagnation
- `surface-heating-map`: Heat flux distribution across the vehicle
- `reusability-requirement`: Expendable (ablative OK) or reusable (must survive multiple entries)

## Outputs

- `tps-zone-map`: Vehicle divided into zones with material assigned to each
- `material-properties`: Thermal conductivity, density, ablation rate, max temperature for each material
- `mass-estimate-by-zone`: TPS mass estimate per zone before thickness optimization

## Process

1. Ablative TPS (expendable): the material absorbs heat by charring and sublimating. PICA (Phenolic Impregnated Carbon Ablator) handles up to 200 W/cm^2, density 0.27 g/cm^3, used on Stardust, Dragon. SLA-561V (cork-silicone) handles up to 100 W/cm^2, density 0.26 g/cm^3, used on Mars landers. Avcoat handles up to 300 W/cm^2, density 0.51 g/cm^3, used on Apollo and Orion.
2. Reusable TPS: must survive hundreds of entries without replacement. Reinforced Carbon-Carbon (RCC) for the hottest regions (nose cap, wing leading edges on Shuttle: 1,650 C). Ceramic tiles (LI-900: density 0.14 g/cm^3, rated to 1,260 C; LI-2200: to 1,480 C) for moderate heating. Flexible blankets (AFRSI, FRSI) for low-heating regions. TUFROC (Shuttle successor) improves on tile technology.
3. For modern reusable vehicles (Falcon 9, Starship), hexagonal heat shield tiles with stainless steel or carbon fiber substrate are used. The tile material must survive thermal cycling and remain attached through vibration. SpaceX uses a proprietary ceramic tile system on Starship.
4. Zone the vehicle by heating severity: nose/stagnation (highest, ablative or RCC), windward body (moderate, tiles or ablative), leeward body (low, blankets or insulation), base (complex, engine plume heating during retropropulsion). Each zone boundary must have a smooth transition to avoid step heating.
5. Mass estimation: for ablative TPS, mass scales approximately linearly with total heat load (the material must absorb the energy). For insulative TPS (tiles), mass scales with peak heat flux (thicker insulation needed for higher flux to limit back-face temperature). First-order estimate: 10-40 kg/m^2 depending on material and environment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
