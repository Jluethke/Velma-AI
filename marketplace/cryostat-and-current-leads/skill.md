# Cryostat And Current Leads

Design the cryostat, thermal shields, and current leads for the magnet system.

## Inputs

- `quench-detection-scheme`: Quench detection and protection design
- `energy-extraction-design`: Energy extraction system
- `hot-spot-temperature`: Peak temperature during quench

## Outputs

- `cryostat-design`: Vacuum vessel, thermal shields, and support structure
- `current-lead-design`: Current lead type, heat load, and helium consumption
- `heat-load-budget`: Itemized heat load at each temperature stage

## Process

1. Design the vacuum vessel: stainless steel, welded construction, leak rate < 10^-9 mbar*L/s. Structural design for atmospheric pressure (external pressure vessel code). Ports for current leads, instrumentation, cryogen fill/vent.
2. Design thermal radiation shields: aluminum or copper sheet at 40-80K, cooled by helium gas or cryocooler. MLI superinsulation (30-60 layers) between 300K and shield, and between shield and cold mass. Calculate radiative heat load: Q = epsilon_eff * sigma * A * (T_hot^4 - T_cold^4).
3. Design cold mass supports: low thermal conductivity, high strength. Options: tension rods (Ti-6Al-4V, G10), compression posts (G10 tubes), suspension from Kevlar or carbon fiber. Intercept at intermediate temperature to reduce 4K heat load.
4. Design current leads: gas-cooled copper leads (optimized mass per Mcallan's rule: Q_min = 47 W/kA for 300K to 4.2K) or hybrid HTS leads (HTS section from 50-70K to 4K with zero Joule heating, copper section from 300K to 50-70K). HTS leads reduce helium consumption by factor of 10.
5. Build the total heat load budget: radiation, conduction through supports, current leads, instrumentation wires, residual gas. Size the cryogenic plant: liquid helium consumption (L/hr) or cryocooler capacity (W at 4K). Include margin of at least 50% for uncertainties.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
