# Passive Thermal Control Design

Design passive elements: multilayer insulation, coatings, thermal straps, and conductive isolation.

## Inputs

- `heat_balance`: Heat flows that passive elements must shape.
- `surface_property_selection`: Coatings chosen for the external surfaces.

## Outputs

- `mli_design`: Multilayer insulation layout and effective emittance.
- `coating_map`: Surface-by-surface coating assignment.
- `conductive_paths`: Thermal straps, doublers, and isolation standoffs.

## Process

1. Multilayer insulation of 15 to 30 layers reaches an effective emittance near 0.01 to 0.03, cutting radiative loss from enclosed surfaces by one to two orders of magnitude.
2. Isolate warm units from cold structure with low-conductance standoffs; conduction through a path is Q = k * A * dT / L, so a thin, low-conductivity, long path minimizes leak.
3. Size thermal straps and doublers to move heat from a hot unit to a radiator: a 100 mm by 100 mm by 3 mm aluminum doubler (k = 180 W/m/K) carries roughly k*A/L of conductance.
4. Map coatings per surface: radiators get low-absorptance reflectors, insulated zones get outer MLI layers, and internal surfaces often get high-emittance black paint to even out gradients.
5. Check that passive design alone holds the cold case within limits before adding heaters, since passive control adds no power.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
