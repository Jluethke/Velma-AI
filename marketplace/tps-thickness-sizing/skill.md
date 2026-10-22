# Tps Thickness Sizing

Size TPS thickness at each location to limit the bondline temperature to the structural material allowable.

## Inputs

- `tps-zone-map`: Material assigned to each zone
- `material-properties`: Thermal properties of each TPS material
- `surface-heating-map`: Heat flux time history at each location

## Outputs

- `thickness-map`: TPS thickness at each zone location
- `bondline-temperature-history`: Temperature at the TPS-structure interface vs time
- `soak-back-peak`: Maximum bondline temperature (may occur after peak heating, during soak-back)
- `final-tps-mass`: Total TPS mass from thickness integration over the vehicle surface

## Process

1. The constraint: bondline temperature must stay below the structural material limit. For aluminum structure: 177 C (350 F). For titanium: 315 C (600 F). For CFRP: 150-250 C depending on resin. This single temperature limit, combined with the heating environment, determines the TPS thickness.
2. For insulative TPS (tiles, blankets): solve the 1-D heat conduction equation through the TPS thickness with the applied heat flux as the surface boundary condition. Iterate on thickness until the bondline temperature meets the requirement. Include thermal soak-back: after peak heating, the stored thermal energy in the TPS conducts inward and the bondline temperature continues to rise.
3. For ablative TPS: the surface recession removes material and energy. Model the charring ablation: virgin material pyrolyzes to form a char layer, releasing pyrolysis gas that blows through the char and provides additional surface cooling (blowing correction). The recession rate depends on heat flux and surface temperature.
4. Thermal margin: add 25% to the calculated thickness for material property uncertainty, manufacturing variation, and gap heating effects. Gaps between tiles or ablator blocks allow hot gas penetration to the bondline. Gap filler design is critical for tiled systems.
5. Account for soak-back: after the entry heating ends, the TPS surface cools radiatively but the interior is still hot. Heat conducts inward to the bondline, and the bondline temperature peaks 5-30 minutes after peak surface heating. The maximum bondline temperature is often the soak-back peak, not the temperature during peak heating.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
