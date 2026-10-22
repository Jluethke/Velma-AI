# Cryogenic Insulation Design

Select and design insulation for cryogenic propellant tanks to manage boiloff, ice formation, and thermal stress.

## Inputs

- `tank-dimensions`: Tank surface area and wall material
- `propellant-combination`: Propellant storage temperature and boiling point
- `ground-hold-duration`: Time between tank loading and launch

## Outputs

- `insulation-type`: Selected insulation system with thickness
- `boiloff-rate`: Propellant boiloff rate in kg/hr for ground hold and flight
- `ice-prevention-strategy`: Method to prevent ice formation on external surfaces
- `thermal-stress-analysis`: Stress from differential thermal contraction between insulation and tank wall

## Process

1. Spray-on foam insulation (SOFI): polyurethane or polyisocyanurate foam sprayed directly on the tank exterior. Low cost, well-characterized. Thermal conductivity 0.02-0.04 W/m*K. Thickness 25-75 mm. Risk: foam shedding during ascent (Columbia accident). Used on ET, SLS, Falcon 9 upper stage (internal insulation).
2. Multi-layer insulation (MLI): alternating layers of aluminized Mylar and Dacron net spacers in vacuum. Effective thermal conductivity 0.0001-0.001 W/m*K in vacuum (100x better than foam). But only works in vacuum or near-vacuum. Used for upper stages and in-space stages. Ground hold requires purge gas (helium or nitrogen) to prevent condensation.
3. Aerogel blankets: silica aerogel in a flexible blanket. Thermal conductivity 0.01-0.02 W/m*K at sea level, better in vacuum. Handles compression better than MLI. Emerging option for reusable vehicle ground hold. Does not shed like foam.
4. Internal insulation: insulation applied to the inside of the tank wall, with the propellant in contact with the insulation. Used when external insulation is impractical (reusable vehicles where external TPS covers the tank). The insulation must be compatible with the propellant (LOX compatibility is a safety requirement) and resist delamination under cryogenic cycling.
5. Boiloff calculation: heat leak through insulation raises propellant temperature until boiling begins. For a LOX tank with 50 mm foam in ambient conditions, expect 0.5-2 kg/m^2/hr boiloff. Boiloff must be managed by venting (with vapor recovery on ground) or by subcooling the propellant below its boiling point (densification, as SpaceX uses on Falcon 9).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
